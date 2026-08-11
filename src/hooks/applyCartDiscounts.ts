import type { CollectionBeforeChangeHook } from 'payload'

import { validateCoupon, validateGiftCard } from '@/lib/discounts'

/**
 * Runs AFTER the ecommerce plugin's own `beforeChangeCart` hook (which sets
 * `data.subtotal` to the raw item-price sum on every save). This hook nets
 * a coupon/gift-card discount off of that raw value, always recomputing from
 * `data.subtotal` fresh rather than a previously-discounted value — so it
 * stays correct across repeated cart saves (item added/removed/qty changed)
 * without compounding the discount.
 */
export const applyCartDiscounts: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const couponCode: string | undefined =
    data?.appliedCouponCode !== undefined ? data.appliedCouponCode : originalDoc?.appliedCouponCode
  const giftCardCode: string | undefined =
    data?.appliedGiftCardCode !== undefined ? data.appliedGiftCardCode : originalDoc?.appliedGiftCardCode

  const rawSubtotal = typeof data?.subtotal === 'number' ? data.subtotal : 0
  let subtotal = rawSubtotal
  let couponDiscountAmount = 0
  let giftCardAmountApplied = 0

  // Server-side enforcement, not just hiding the UI — a request crafted
  // directly against /api/cart/discount shouldn't be able to apply a gift
  // card while the feature is flagged off.
  const featureFlags = await req.payload.findGlobal({ slug: 'feature-flags', overrideAccess: true }).catch(() => null)
  const giftCardsEnabled = featureFlags?.giftCards !== false

  if (couponCode) {
    const result = await validateCoupon(req.payload, couponCode, rawSubtotal)
    if (result.valid) {
      couponDiscountAmount = result.discountAmount
      subtotal = Math.max(subtotal - couponDiscountAmount, 0)
    }
  }

  if (giftCardCode && giftCardsEnabled) {
    const result = await validateGiftCard(req.payload, giftCardCode)
    if (result.valid) {
      giftCardAmountApplied = Math.min(result.balance, subtotal)
      subtotal = Math.max(subtotal - giftCardAmountApplied, 0)
    }
  }

  return {
    ...data,
    appliedCouponCode: couponCode || null,
    appliedGiftCardCode: giftCardsEnabled ? giftCardCode || null : null,
    couponDiscountAmount,
    giftCardAmountApplied,
    subtotal,
  }
}
