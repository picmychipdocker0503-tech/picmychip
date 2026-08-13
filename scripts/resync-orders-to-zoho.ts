import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { zohoIsConfigured } from '../src/lib/zoho/auth'
import { syncZohoInvoiceForOrder } from '../src/lib/orderIntegrations/syncZohoInvoice'

// Backfills/rechecks Zoho Books invoices and payments for every non-cancelled
// order. Safe to re-run: syncZohoInvoiceForOrder checks Zoho for an existing
// invoice (by reference_number = order id) before creating anything, and if
// the invoice still has a balance it records the matching customer payment.
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
    payload.logger.info(`Syncing order ${order.id} (current invoiceSyncStatus=${order.invoiceSyncStatus})...`)
    await syncZohoInvoiceForOrder(payload, order.id)

    const updated = await payload.findByID({ collection: 'orders', id: order.id, depth: 0, overrideAccess: true })
    payload.logger.info(
      `Order ${order.id}: invoiceSyncStatus=${updated.invoiceSyncStatus} zohoInvoiceNumber=${updated.zohoInvoiceNumber} error=${updated.integrationError?.invoice || 'none'}`,
    )
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
