import type { CollectionAfterChangeHook } from 'payload'

/**
 * Lightweight, non-blocking fraud heuristic: flags high-value guest orders
 * for manual admin review. This does NOT block checkout — PayU's own
 * risk/fraud screening already covers the payment itself; this just surfaces
 * a second, business-level signal it can't see (no account history to vouch
 * for the buyer) directly on the order.
 */
const GUEST_HIGH_VALUE_THRESHOLD_INR = 50000

export const flagPotentialFraud: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create' || doc.customer) return doc

  const amount = doc.amount ?? 0
  const threshold = GUEST_HIGH_VALUE_THRESHOLD_INR

  if (amount < threshold) return doc

  try {
    await req.payload.update({
      collection: 'orders',
      id: doc.id,
      data: {
        flaggedForReview: true,
        flagReason: `Guest checkout over ${doc.currency} ${threshold.toFixed(0)} — no account history to verify buyer.`,
      },
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to set fraud review flag', err })
  }

  return doc
}
