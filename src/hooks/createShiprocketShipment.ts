import type { CollectionAfterChangeHook } from 'payload'

import { syncShiprocketShipmentForOrder } from '@/lib/orderIntegrations/syncShiprocketShipment'

/**
 * Auto-books the shipment with Shiprocket as soon as a paid/COD order is
 * created, so it appears in the Shiprocket dashboard ready for pickup —
 * mirrors the "read doc, then payload.update()" pattern used by the other
 * order afterChange hooks (see applyOrderDiscountSideEffects). Setting
 * `trackingNumber` here piggybacks on sendOrderLifecycleEmails, which already
 * emails the customer whenever that field changes.
 *
 * All the actual work (idempotency, error capture, field writes) lives in
 * syncShiprocketShipmentForOrder so the admin "Retry shipment" endpoint can
 * reuse the exact same logic. No-ops entirely (not an error) until
 * SHIPROCKET_* env vars are set, same convention as the SMTP/R2 integrations.
 */
export const createShiprocketShipment: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  await syncShiprocketShipmentForOrder(req.payload, doc.id)

  return doc
}
