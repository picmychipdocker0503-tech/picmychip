import type { CollectionAfterChangeHook } from 'payload'

import { syncZohoSalesOrderForOrder } from '@/lib/orderIntegrations/syncZohoSalesOrder'

const scheduledOrderIds = new Set<string>()

/**
 * Deferred (setTimeout) rather than run inline — avoids a race where the
 * sync reads the order before its creating transaction has committed.
 * Dedup-guarded so calling this from both the afterChange hook and directly
 * from PayU's confirmOrder (belt-and-suspenders against the hook not firing
 * in time) never runs the sync twice for the same order.
 */
export function scheduleZohoSalesOrderSync(
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  orderId: number | string,
) {
  const key = String(orderId)
  if (scheduledOrderIds.has(key)) return
  scheduledOrderIds.add(key)

  const delayMs = Number(process.env.ZOHO_INVOICE_SYNC_DELAY_MS || 1500)

  setTimeout(() => {
    syncZohoSalesOrderForOrder(req.payload, orderId)
      .catch((err) => {
        req.payload.logger.error({ msg: 'Background Zoho sales order sync failed', err, orderId })
      })
      .finally(() => {
        scheduledOrderIds.delete(key)
      })
  }, delayMs)
}

/**
 * Auto-creates the Zoho Sales Order as soon as an order is created — mirrors
 * the "read doc, then payload.update()" pattern used by the other order
 * afterChange hooks (see applyOrderDiscountSideEffects). All the actual work
 * (idempotency, error capture, field writes, and detecting a sales order
 * accepted directly in Zoho) lives in syncZohoSalesOrderForOrder so the
 * admin "Retry" endpoint can reuse the exact same logic.
 *
 * No-ops entirely (not an error) until ZOHO_* env vars are set, same
 * convention as the SMTP/R2/Shiprocket integrations.
 */
export const createZohoSalesOrder: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  scheduleZohoSalesOrderSync(req, doc.id)

  return doc
}
