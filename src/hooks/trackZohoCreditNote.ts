import type { CollectionAfterChangeHook } from 'payload'

import { refreshZohoCreditNoteForOrder } from '@/lib/orderIntegrations/syncZohoSalesOrder'

export const trackZohoCreditNote: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const shouldTrack =
    (doc.status === 'cancelled' || doc.status === 'refunded') && previousDoc?.status !== doc.status

  if (!shouldTrack || !doc.zohoInvoiceId) return doc

  setTimeout(() => {
    void refreshZohoCreditNoteForOrder(req.payload, doc.id)
  }, 0)

  return doc
}
