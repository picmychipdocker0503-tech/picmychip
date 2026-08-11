import type { CollectionAfterChangeHook } from 'payload'

import { incrementCouponRedemption, redeemGiftCard } from '@/lib/discounts'

/**
 * Backfills couponApplied/giftCardApplied onto PayU-paid orders (the plugin's
 * own order-creation code has no knowledge of coupons/gift cards) by tracing
 * order -> transaction -> cart, then commits the redemption side effects
 * (coupon redemptionCount++, gift card balance--). Orders created directly by
 * the COD/gift-card-covered route already set these fields + `discountsApplied`
 * at creation time, so this hook is a no-op for those (guarded below).
 */
export const applyOrderDiscountSideEffects: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || doc.discountsApplied) return doc

  const transactionRef = doc.transactions?.[0]
  if (!transactionRef) return doc

  try {
    const transactionId = typeof transactionRef === 'object' ? transactionRef.id : transactionRef

    const transaction = await req.payload.findByID({
      collection: 'transactions',
      id: transactionId,
      depth: 0,
      overrideAccess: true,
    })

    const cartId = typeof transaction?.cart === 'object' ? transaction.cart?.id : transaction?.cart
    if (!cartId) return doc

    const cart = await req.payload.findByID({
      collection: 'carts',
      id: cartId,
      depth: 0,
      overrideAccess: true,
    })

    const updates: Record<string, unknown> = { discountsApplied: true }

    if (cart?.appliedCouponCode && cart.couponDiscountAmount) {
      updates.couponApplied = {
        code: cart.appliedCouponCode,
        discountAmount: cart.couponDiscountAmount,
      }
      await incrementCouponRedemption(req.payload, cart.appliedCouponCode)
    }

    if (cart?.appliedGiftCardCode && cart.giftCardAmountApplied) {
      updates.giftCardApplied = {
        code: cart.appliedGiftCardCode,
        amountApplied: cart.giftCardAmountApplied,
      }
      await redeemGiftCard(req.payload, cart.appliedGiftCardCode, cart.giftCardAmountApplied, doc.id)
    }

    await req.payload.update({
      collection: 'orders',
      id: doc.id,
      data: updates,
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to apply order discount side effects', err })
  }

  return doc
}
