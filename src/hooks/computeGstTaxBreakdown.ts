import type { CollectionAfterChangeHook } from 'payload'

import { computeOrderTaxAddOn, type TaxLineItem } from '@/lib/taxCalculation'

/**
 * Snapshots the GST split (CGST+SGST for intra-state vs IGST for inter-state)
 * onto the order at creation time, comparing the customer's shipping state
 * against SiteSettings.taxSettings.businessState. Storing a snapshot — rather
 * than recomputing from the live SiteSettings global on every render, as the
 * invoice page previously did — keeps historical invoices stable if the
 * admin changes the GST rate or business state later.
 *
 * Computed per line item (each product can carry its own gstPercent, falling
 * back to the site default) via computeOrderTaxAddOn — the same GST-add
 * computation checkout used to arrive at doc.amount, applied to the same
 * discounted base (reconstructed here from the nominal item total minus any
 * coupon/gift-card discount). Deliberately does NOT decompose doc.amount
 * directly: for a cart mixing multiple GST rates, decomposing an inclusive
 * total with nominal-weighted proration reconstructs a slightly different
 * split than the one actually charged, since each rate's true share of the
 * total shifts once tax is added. Recomputing with the same add-on formula
 * and inputs as checkout keeps this snapshot exact.
 */
export const computeGstTaxBreakdown: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  try {
    const siteSettings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const tax = siteSettings?.taxSettings
    const defaultGstPercent = tax?.gstRatePercent ?? 18

    const itemsWithNominal = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc.items || []).map(async (item: any): Promise<TaxLineItem | null> => {
        const productId = typeof item.product === 'object' ? item.product?.id : item.product
        const quantity = item.quantity ?? 1
        if (!productId) return null

        const product =
          typeof item.product === 'object' && item.product
            ? item.product
            : await req.payload.findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true })

        const variant =
          item.variant && typeof item.variant === 'object'
            ? item.variant
            : item.variant
              ? await req.payload.findByID({ collection: 'variants', id: item.variant, depth: 0, overrideAccess: true })
              : undefined

        const unitPrice = (variant?.priceInINR ?? product?.priceInINR ?? 0) as number
        const gstPercent = (product?.gstPercent ?? defaultGstPercent) as number

        return { gstPercent, nominal: unitPrice * quantity }
      }),
    )

    const validItems = itemsWithNominal.filter((item): item is TaxLineItem => Boolean(item))
    const nominalTotal = validItems.reduce((sum, item) => sum + item.nominal, 0)
    const discountedBase = Math.max(
      0,
      nominalTotal - (doc.couponApplied?.discountAmount ?? 0) - (doc.giftCardApplied?.amountApplied ?? 0),
    )

    const taxBreakdown = computeOrderTaxAddOn({
      items: validItems,
      amount: discountedBase,
      defaultGstPercent,
      businessState: tax?.businessState || process.env.ZOHO_BUSINESS_STATE || 'Karnataka',
      customerState: doc.shippingAddress?.state,
    })

    await req.payload.update({
      collection: 'orders',
      id: doc.id,
      data: { taxBreakdown },
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to compute GST tax breakdown', err, orderId: doc.id })
  }

  return doc
}
