import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

type Body = {
  cartId: number | string
  couponCode?: string
  giftCardCode?: string
  remove?: 'coupon' | 'gift-card'
}

/**
 * Applies/removes a coupon or gift-card code on a cart. Always resends the
 * cart's own `items`/`currency` alongside the discount fields — the plugin's
 * `beforeChangeCart` hook (which recomputes `subtotal` from `data.items`) runs
 * before Payload merges partial update data with the existing document, so a
 * bare `{ appliedCouponCode }` patch would otherwise zero out the subtotal.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body
  const { cartId, couponCode, giftCardCode, remove } = body

  if (!cartId) {
    return NextResponse.json({ error: 'Missing cartId.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const cart = await payload.findByID({
      collection: 'carts',
      id: cartId,
      depth: 0,
      overrideAccess: true,
    })

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found.' }, { status: 404 })
    }

    const data: Record<string, unknown> = {
      items: cart.items,
      currency: cart.currency,
    }

    if (remove === 'coupon') {
      data.appliedCouponCode = null
    } else if (remove === 'gift-card') {
      data.appliedGiftCardCode = null
    } else {
      if (couponCode) data.appliedCouponCode = couponCode
      if (giftCardCode) data.appliedGiftCardCode = giftCardCode
    }

    const updated = await payload.update({
      collection: 'carts',
      id: cartId,
      data,
      overrideAccess: true,
    })

    const couponApplied = Boolean(updated.appliedCouponCode) && (updated.couponDiscountAmount ?? 0) > 0
    const giftCardApplied =
      Boolean(updated.appliedGiftCardCode) && (updated.giftCardAmountApplied ?? 0) > 0

    if (couponCode && !remove && !couponApplied) {
      return NextResponse.json(
        { error: 'That coupon code is invalid, expired, or not applicable to this order.' },
        { status: 400 },
      )
    }

    if (giftCardCode && !remove && !giftCardApplied) {
      return NextResponse.json(
        { error: 'That gift card code is invalid or has no remaining balance.' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      subtotal: updated.subtotal,
      appliedCouponCode: updated.appliedCouponCode,
      appliedGiftCardCode: updated.appliedGiftCardCode,
      couponDiscountAmount: updated.couponDiscountAmount,
      giftCardAmountApplied: updated.giftCardAmountApplied,
    })
  } catch (err) {
    payload.logger.error({ msg: 'Failed to apply cart discount', err })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
