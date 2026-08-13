import type { CollectionAfterChangeHook } from 'payload'

import { syncZohoInvoiceForOrder } from '@/lib/orderIntegrations/syncZohoInvoice'

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

  await syncZohoInvoiceForOrder(req.payload, doc.id)

  return doc
}
