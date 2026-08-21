import type { CollectionAfterChangeHook } from 'payload'

import { syncZohoSalesOrderForOrder } from '@/lib/orderIntegrations/syncZohoSalesOrder'
const runningOrderIds = new Set<string>()

/**
 * Runs the Zoho sync after the order create transaction has finished. Zoho
 * calls are external network calls and can take seconds; keeping the Payload
 * create transaction open while waiting for them causes Postgres
 * idle-in-transaction timeouts.
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

  setTimeout(() => {
    void runZohoSalesOrderSync(req, doc.id)
  }, 0)

  return doc
}
