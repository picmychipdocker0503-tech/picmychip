import type { CollectionAfterChangeHook } from 'payload'

import { syncZohoInvoiceForOrder } from '@/lib/orderIntegrations/syncZohoInvoice'

const scheduledOrderIds = new Set<string>()

export function scheduleZohoInvoiceSync(req: Parameters<CollectionAfterChangeHook>[0]['req'], orderId: number | string) {
  const key = String(orderId)
  if (scheduledOrderIds.has(key)) return
  scheduledOrderIds.add(key)

  const delayMs = Number(process.env.ZOHO_INVOICE_SYNC_DELAY_MS || 1500)

  setTimeout(() => {
    syncZohoInvoiceForOrder(req.payload, orderId).catch((err) => {
      req.payload.logger.error({ msg: 'Background Zoho invoice sync failed', err, orderId })
    }).finally(() => {
      scheduledOrderIds.delete(key)
    })
  }, delayMs)
}

/**
 * Auto-generates the Zoho GST invoice as soon as an order is created — mirrors
 * the "read doc, then payload.update()" pattern used by the other order
 * afterChange hooks (see applyOrderDiscountSideEffects). All the actual work
 * (idempotency, error capture, field writes) lives in syncZohoInvoiceForOrder
 * so the admin "Retry invoice" endpoint can reuse the exact same logic.
 *
 * No-ops entirely (not an error) until ZOHO_* env vars are set, same
 * convention as the SMTP/R2/Shiprocket integrations.
 */
export const createZohoInvoice: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  scheduleZohoInvoiceSync(req, doc.id)

  return doc
}
