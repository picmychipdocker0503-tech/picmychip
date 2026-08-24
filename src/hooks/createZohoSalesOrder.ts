import configPromise from '@payload-config'
import { getPayload, type CollectionAfterChangeHook, type Payload } from 'payload'

import { syncZohoSalesOrderForOrder } from '@/lib/orderIntegrations/syncZohoSalesOrder'

type SyncLoggerSource = Pick<Parameters<CollectionAfterChangeHook>[0]['req'], 'payload'>

const orderVisibilityRetryDelaysMs = [250, 750, 1500, 3000]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForOrderToBeReadable(payload: Payload, orderId: number | string): Promise<void> {
  for (let attempt = 0; attempt <= orderVisibilityRetryDelaysMs.length; attempt += 1) {
    try {
      await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
      return
    } catch (err) {
      if (attempt === orderVisibilityRetryDelaysMs.length) throw err
      await wait(orderVisibilityRetryDelaysMs[attempt])
    }
  }
}

/**
 * Runs the Zoho sync after the order create transaction has finished. Zoho
 * calls are external network calls and can take seconds; keeping the Payload
 * create transaction open while waiting for them causes Postgres
 * idle-in-transaction timeouts.
 */
export async function runZohoSalesOrderSync(
  req: SyncLoggerSource,
  orderId: number | string,
): Promise<void> {
  try {
    const payload = await getPayload({ config: configPromise })
    await waitForOrderToBeReadable(payload, orderId)
    await syncZohoSalesOrderForOrder(payload, orderId)
  } catch (err) {
    req.payload.logger.error({ msg: 'Zoho sales order sync failed', err, orderId })
  }
}

/**
 * Auto-creates the Zoho Sales Order as soon as an order is created. The actual
 * work (idempotency, error capture, field writes, and detecting a sales order
 * accepted directly in Zoho) lives in syncZohoSalesOrderForOrder so the admin
 * "Retry" endpoint can reuse the same logic.
 *
 * No-ops entirely (not an error) until ZOHO_* env vars are set, same
 * convention as the SMTP/R2/Shiprocket integrations.
 */
export const createZohoSalesOrder: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  setTimeout(() => {
    void runZohoSalesOrderSync(req, doc.id)
  }, 250)

  return doc
}
