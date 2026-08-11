import type { Payload } from 'payload'

import type { Coupon, GiftCard } from '@/payload-types'

export type CouponValidation =
  | { valid: true; discountAmount: number; coupon: Coupon }
  | { valid: false; discountAmount: 0; reason: string }

export type GiftCardValidation =
  | { valid: true; balance: number; giftCard: GiftCard }
  | { valid: false; balance: 0; reason: string }

const normalizeCode = (code: string) => code.trim().toUpperCase()

export async function validateCoupon(
  payload: Payload,
  code: string,
  subtotal: number,
): Promise<CouponValidation> {
  if (!code) return { valid: false, discountAmount: 0, reason: 'No coupon code provided.' }

  const { docs } = await payload.find({
    collection: 'coupons',
    where: { code: { equals: normalizeCode(code) } },
    limit: 1,
    overrideAccess: true,
  })

  const coupon = docs[0]

  if (!coupon) return { valid: false, discountAmount: 0, reason: 'Coupon code not found.' }
  if (!coupon.active) return { valid: false, discountAmount: 0, reason: 'This coupon is no longer active.' }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, discountAmount: 0, reason: 'This coupon has expired.' }
  }
  if (
    typeof coupon.maxRedemptions === 'number' &&
    (coupon.redemptionCount ?? 0) >= coupon.maxRedemptions
  ) {
    return { valid: false, discountAmount: 0, reason: 'This coupon has reached its redemption limit.' }
  }
  if (typeof coupon.minOrderAmount === 'number' && subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      reason: `This coupon requires a minimum order of ${coupon.minOrderAmount}.`,
    }
  }

  const discountAmount =
    coupon.type === 'percentage'
      ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, subtotal)

  return { valid: true, discountAmount, coupon }
}

export async function validateGiftCard(payload: Payload, code: string): Promise<GiftCardValidation> {
  if (!code) return { valid: false, balance: 0, reason: 'No gift card code provided.' }

  const { docs } = await payload.find({
    collection: 'gift-cards',
    where: { code: { equals: normalizeCode(code) } },
    limit: 1,
    overrideAccess: true,
  })

  const giftCard = docs[0]

  if (!giftCard) return { valid: false, balance: 0, reason: 'Gift card code not found.' }
  if (giftCard.status !== 'active') return { valid: false, balance: 0, reason: 'This gift card is not active.' }
  if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
    return { valid: false, balance: 0, reason: 'This gift card has expired.' }
  }
  if ((giftCard.balance ?? 0) <= 0) {
    return { valid: false, balance: 0, reason: 'This gift card has no remaining balance.' }
  }

  return { valid: true, balance: giftCard.balance ?? 0, giftCard }
}

export async function incrementCouponRedemption(payload: Payload, code: string): Promise<void> {
  const { docs } = await payload.find({
    collection: 'coupons',
    where: { code: { equals: normalizeCode(code) } },
    limit: 1,
    overrideAccess: true,
  })

  const coupon = docs[0]
  if (!coupon) return

  await payload.update({
    collection: 'coupons',
    id: coupon.id,
    data: { redemptionCount: (coupon.redemptionCount ?? 0) + 1 },
    overrideAccess: true,
  })
}

export async function redeemGiftCard(
  payload: Payload,
  code: string,
  amount: number,
  orderId: number,
): Promise<void> {
  const { docs } = await payload.find({
    collection: 'gift-cards',
    where: { code: { equals: normalizeCode(code) } },
    limit: 1,
    overrideAccess: true,
  })

  const giftCard = docs[0]
  if (!giftCard) return

  const clampedAmount = Math.min(amount, giftCard.balance ?? 0)
  const newBalance = Math.max((giftCard.balance ?? 0) - clampedAmount, 0)

  await payload.update({
    collection: 'gift-cards',
    id: giftCard.id,
    data: {
      balance: newBalance,
      status: newBalance <= 0 ? 'redeemed' : giftCard.status,
      redemptions: [
        ...(giftCard.redemptions ?? []),
        { orderRef: orderId, amount: clampedAmount, redeemedAt: new Date().toISOString() },
      ],
    },
    overrideAccess: true,
  })
}
