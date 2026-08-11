import type { CollectionAfterChangeHook } from 'payload'

/**
 * Snapshots the GST split (CGST+SGST for intra-state vs IGST for inter-state)
 * onto the order at creation time, comparing the customer's shipping state
 * against SiteSettings.taxSettings.businessState. Storing a snapshot — rather
 * than recomputing from the live SiteSettings global on every render, as the
 * invoice page previously did — keeps historical invoices stable if the
 * admin changes the GST rate or business state later. Prices are assumed
 * GST-inclusive (see the taxSettings field description), so this decomposes
 * `amount` rather than adding to it — the order total is unaffected.
 */
export const computeGstTaxBreakdown: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  try {
    const siteSettings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const tax = siteSettings?.taxSettings

    const gstRatePercent = tax?.gstRatePercent ?? 18
    const amount = doc.amount ?? 0
    const taxableValue = amount / (1 + gstRatePercent / 100)
    const totalTax = amount - taxableValue

    const businessState = (tax?.businessState || '').trim().toLowerCase()
    const customerState = (doc.shippingAddress?.state || '').trim().toLowerCase()
    const isIntraState = Boolean(businessState) && Boolean(customerState) && businessState === customerState

    await req.payload.update({
      collection: 'orders',
      id: doc.id,
      data: {
        taxBreakdown: {
          taxType: isIntraState ? 'intra-state' : 'inter-state',
          gstRatePercent,
          taxableValue,
          cgstAmount: isIntraState ? totalTax / 2 : 0,
          sgstAmount: isIntraState ? totalTax / 2 : 0,
          igstAmount: isIntraState ? 0 : totalTax,
          totalTax,
        },
      },
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to compute GST tax breakdown', err, orderId: doc.id })
  }

  return doc
}
