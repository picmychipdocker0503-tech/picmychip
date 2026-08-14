import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { zohoIsConfigured } from '../src/lib/zoho/auth'
import { syncZohoSalesOrderForOrder } from '../src/lib/orderIntegrations/syncZohoSalesOrder'

// Backfills/rechecks Zoho sales orders (and any invoice already linked to
// one — whether generated via the admin "Accept" action or directly inside
// Zoho Books) for every non-cancelled order. Safe to re-run:
// syncZohoSalesOrderForOrder checks Zoho for an existing sales order (by
// reference_number = order id) before creating anything.
const run = async () => {
  const payload = await getPayload({ config })

  if (!zohoIsConfigured) {
    payload.logger.error('Zoho is not configured (missing ZOHO_* env vars) — nothing to do.')
    process.exit(1)
  }

  const { docs: orders } = await payload.find({
    collection: 'orders',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    where: {
      status: { not_equals: 'cancelled' },
    },
  })

  payload.logger.info(`Found ${orders.length} order(s) to resync.`)

  for (const order of orders) {
    payload.logger.info(`Syncing order ${order.id} (current salesOrderSyncStatus=${order.salesOrderSyncStatus})...`)
    await syncZohoSalesOrderForOrder(payload, order.id)

    const updated = await payload.findByID({ collection: 'orders', id: order.id, depth: 0, overrideAccess: true })
    payload.logger.info(
      `Order ${order.id}: salesOrderSyncStatus=${updated.salesOrderSyncStatus} zohoSalesOrderNumber=${updated.zohoSalesOrderNumber} invoiceSyncStatus=${updated.invoiceSyncStatus} zohoInvoiceNumber=${updated.zohoInvoiceNumber}`,
    )
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
