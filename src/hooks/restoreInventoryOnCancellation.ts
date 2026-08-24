import type { CollectionAfterChangeHook } from 'payload'

import { restoreInventoryForOrderItems } from '@/lib/inventory'

const TERMINAL_STATUSES = new Set(['cancelled', 'refunded'])

/**
 * Adds inventory back when an order is cancelled or refunded — the symmetric
 * counterpart to decrementInventoryForOrderItems, which now runs at order
 * *placement* for every payment method. Without this, a cancelled order
 * would leave stock understated forever instead of just for however long it
 * takes to actually ship.
 *
 * Only fires on the transition into cancelled/refunded (not already having
 * been in one), so re-saving an already-cancelled order never double-restores.
 */
export const restoreInventoryOnCancellation: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') return doc

  const wasTerminal = TERMINAL_STATUSES.has(previousDoc?.status)
  const isNowTerminal = TERMINAL_STATUSES.has(doc.status)
  if (wasTerminal || !isNowTerminal) return doc

  try {
    await restoreInventoryForOrderItems(req.payload, doc.items)
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to restore inventory after order cancellation', err, orderId: doc.id })
  }

  return doc
}
