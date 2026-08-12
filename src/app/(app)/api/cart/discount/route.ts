import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

type Body = {
  cartId: number | string
  couponCode?: string
  giftCardCode?: string
  remove?: 'coupon' | 'gift-card'
  /** Guest-cart proof of ownership — mirrors the plugin's own hasCartSecretAccess check. */
  secret?: string
}

/**
 * Applies/removes a coupon or gift-card code on a cart. Always resends the
 * cart's own `items`/`currency` alongside the discount fields — the plugin's
 * `beforeChangeCart` hook (which recomputes `subtotal` from `data.items`) runs
 * before Payload merges partial update data with the existing document, so a
 * bare `{ appliedCouponCode }` patch would otherwise zero out the subtotal.
 */
export async function POST(request: NextRequest) {
  // Codes are guessable strings — without this, a client could brute-force
  // coupon/gift-card codes by hammering this endpoint.
  const ip = getClientIp(request.headers)
  const { allowed, resetAt } = checkRateLimit(`cart-discount:${ip}`, 15, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } },
    )
  }

  const body = (await request.json()) as Body
  const { cartId, couponCode, giftCardCode, remove, secret } = body

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

    // `overrideAccess: true` above and below bypasses the collection's own
    // access control, so ownership has to be re-checked by hand here — a
    // signed-in customer's own cart, or a guest cart whose secret (the same
    // one the ecommerce plugin's own endpoints require) was supplied.
    const { user } = await payload.auth({ headers: await getHeaders() })
    const customerId = typeof cart.customer === 'object' ? cart.customer?.id : cart.customer
    const ownsAsCustomer = Boolean(user) && customerId === user?.id
    const ownsAsGuest = Boolean(cart.secret) && Boolean(secret) && cart.secret === secret

    if (!ownsAsCustomer && !ownsAsGuest) {
      return NextResponse.json({ error: 'Not authorized to modify this cart.' }, { status: 403 })
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
