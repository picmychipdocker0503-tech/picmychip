import type { Address } from '@/payload-types'

import { incrementCouponRedemption, redeemGiftCard } from '@/lib/discounts'
import { getPostHogClient } from '@/lib/posthog-server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

type Body = {
  cartId: number | string
  email: string
  shippingAddress?: Partial<Address>
  billingAddress?: Partial<Address>
  businessDetails?: { companyName?: string; gstin?: string; panNumber?: string }
}

/**
 * Places an order without going through PayU — used for Cash on Delivery,
 * and automatically for orders a gift card covers in full (subtotal === 0,
 * which PayU's minimum order amount would reject outright). Mirrors
 * exactly what the PayU adapter's confirmOrder does server-side
 * (payload.create on 'orders' with items/amount/currency/shippingAddress/
 * status), just without a PayU transaction — so the same Orders
 * afterChange hooks (email, gift-card issuance) fire identically either way.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body
  const { cartId, email, shippingAddress, billingAddress, businessDetails } = body

  if (!cartId || !email) {
    return NextResponse.json({ error: 'Missing cart or email.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  try {
    const cart = await payload.findByID({
      collection: 'carts',
      id: cartId,
      depth: 1,
      overrideAccess: true,
    })

    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    const amount = cart.subtotal ?? 0
    const paymentMethod: 'cod' | 'gift-card' = amount <= 0 ? 'gift-card' : 'cod'

    const items = cart.items.map((item) => ({
      product: typeof item.product === 'object' ? item.product?.id : item.product,
      variant: typeof item.variant === 'object' ? item.variant?.id : item.variant,
      quantity: item.quantity,
    }))

    const order = await payload.create({
      collection: 'orders',
      data: {
        items,
        shippingAddress: shippingAddress as Address,
        billingAddress: (billingAddress ?? shippingAddress) as Address,
        ...(businessDetails ? { businessDetails } : {}),
        customer: user?.id,
        customerEmail: email,
        status: 'processing',
        amount,
        currency: cart.currency,
        paymentMethod,
        discountsApplied: true,
        ...(cart.appliedCouponCode && cart.couponDiscountAmount
          ? { couponApplied: { code: cart.appliedCouponCode, discountAmount: cart.couponDiscountAmount } }
          : {}),
        ...(cart.appliedGiftCardCode && cart.giftCardAmountApplied
          ? {
              giftCardApplied: {
                code: cart.appliedGiftCardCode,
                amountApplied: cart.giftCardAmountApplied,
              },
            }
          : {}),
      },
      overrideAccess: true,
    })

    if (cart.appliedCouponCode && cart.couponDiscountAmount) {
      await incrementCouponRedemption(payload, cart.appliedCouponCode)
    }

    if (cart.appliedGiftCardCode && cart.giftCardAmountApplied) {
      await redeemGiftCard(payload, cart.appliedGiftCardCode, cart.giftCardAmountApplied, order.id)
    }

    const distinctId = user ? String(user.id) : email
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId,
      event: 'order_placed',
      properties: {
        order_id: order.id,
        payment_method: paymentMethod,
        amount: amount,
        currency: cart.currency,
        item_count: items.length,
        coupon_applied: Boolean(cart.appliedCouponCode),
        gift_card_applied: Boolean(cart.appliedGiftCardCode),
      },
    })
    await posthog.shutdown()

    return NextResponse.json({ orderID: order.id, accessToken: order.accessToken })
  } catch (err) {
    payload.logger.error({ msg: 'Failed to place direct order', err })
    return NextResponse.json({ error: 'Could not place order — please try again.' }, { status: 500 })
  }
}
