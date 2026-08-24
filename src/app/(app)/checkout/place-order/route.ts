import type { Address } from '@/payload-types'

import { incrementCouponRedemption, redeemGiftCard } from '@/lib/discounts'
import { computeCheckoutTotal } from '@/lib/checkoutTax'
import { requireCheckoutShippingMethod } from '@/lib/checkoutShipping'
import { decrementInventoryForOrderItems } from '@/lib/inventory'
import { runZohoSalesOrderSync } from '@/hooks/createZohoSalesOrder'
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
  shippingMethod?: string
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
  const { cartId, email, shippingAddress, billingAddress, businessDetails, shippingMethod } = body

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

    const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })

    let selectedShippingMethod
    try {
      selectedShippingMethod = requireCheckoutShippingMethod(shippingMethod, siteSettings?.shippingSettings ?? undefined)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please select a valid shipping method.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const baseSubtotal = cart.subtotal ?? 0

    let amount = baseSubtotal
    if (baseSubtotal > 0) {
      const tax = siteSettings?.taxSettings
      const defaultGstPercent = tax?.gstRatePercent ?? 18
      const businessState = tax?.businessState || process.env.ZOHO_BUSINESS_STATE || 'Karnataka'
      const customerState = shippingAddress?.state || billingAddress?.state

      const { finalAmount } = await computeCheckoutTotal({
        payload,
        items: cart.items,
        baseSubtotal,
        businessState,
        customerState,
        defaultGstPercent,
      })
      amount = Math.round(finalAmount)
    }

    amount += selectedShippingMethod.amount

    const paymentMethod: 'cod' | 'gift-card' = amount <= 0 ? 'gift-card' : 'cod'

    if (paymentMethod === 'cod') {
      const featureFlags = await payload.findGlobal({ slug: 'feature-flags', depth: 0, overrideAccess: true })
      if (!featureFlags?.cashOnDelivery) {
        return NextResponse.json({ error: 'Cash on Delivery is currently unavailable.' }, { status: 400 })
      }
    }

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
        shippingMethod: selectedShippingMethod.id,
        shippingAmount: selectedShippingMethod.amount,
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

    await decrementInventoryForOrderItems(payload, items)

    if (cart.appliedCouponCode && cart.couponDiscountAmount) {
      await incrementCouponRedemption(payload, cart.appliedCouponCode)
    }

    if (cart.appliedGiftCardCode && cart.giftCardAmountApplied) {
      await redeemGiftCard(payload, cart.appliedGiftCardCode, cart.giftCardAmountApplied, order.id)
    }

    await runZohoSalesOrderSync({ payload }, order.id)

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
