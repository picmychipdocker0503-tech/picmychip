import type { CollectionAfterChangeHook } from 'payload'

import { syncZohoSalesOrderForOrder } from '@/lib/orderIntegrations/syncZohoSalesOrder'

const runningOrderIds = new Set<string>()

/**
 * Runs the Zoho sync in the request that created the order.
 *
 * This used to be delayed with setTimeout, but production runs on Vercel
 * serverless functions where delayed background work can be frozen after the
 * response is sent. That left orders stuck at "processing" until the admin
 * Retry button ran the exact same sync in a foreground request.
 */
export async function runZohoSalesOrderSync(
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  orderId: number | string,
): Promise<void> {
  const key = String(orderId)
  if (runningOrderIds.has(key)) return
  runningOrderIds.add(key)

  try {
    await syncZohoSalesOrderForOrder(req.payload, orderId)
  } catch (err) {
    req.payload.logger.error({ msg: 'Zoho sales order sync failed', err, orderId })
  } finally {
    runningOrderIds.delete(key)
  }
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

  await runZohoSalesOrderSync(req, doc.id)

  return doc
}
