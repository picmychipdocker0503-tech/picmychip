import type { CollectionBeforeChangeHook } from 'payload'

import { computeOrderTaxAddOn, type TaxLineItem } from '@/lib/taxCalculation'

type MinimalItem = { product?: unknown; variant?: unknown; quantity?: number | null }

/** Order-independent identity for an items array — used to detect a real edit vs. an unrelated update that doesn't touch items at all. */
function itemsKey(items: MinimalItem[] | null | undefined): string {
  return (items ?? [])
    .map((item) => {
      const product =
        typeof item.product === 'object' && item.product ? (item.product as { id: unknown }).id : item.product
      const variant =
        typeof item.variant === 'object' && item.variant ? (item.variant as { id: unknown }).id : item.variant
      return `${product ?? ''}:${variant ?? ''}:${item.quantity ?? 0}`
    })
    .sort()
    .join('|')
}

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
 *
 * Also re-runs on update, but ONLY when `items` was actually included in
 * this update AND differs from what's already saved — e.g. an admin
 * removing a line item in the order edit view, or reconcileOrderWithZohoSalesOrder
 * (see syncZohoSalesOrder.ts) writing back a quantity reduced by editing the
 * sales order directly in Zoho Books. Every other update (status change,
 * tracking number, a targeted Local API call that never touches `items`,
 * etc.) leaves amount/taxBreakdown untouched — `data.items` is undefined for
 * those, not just unchanged. On the items-changed path this also
 * recalculates `amount` itself, not just the tax snapshot, since nothing
 * else sets it after an items edit — without this, the order (and every
 * customer-facing page that just displays order.amount) would keep showing
 * the pre-edit total forever. Known approximation: there's no per-line price
 * snapshot on an order, so this uses each product's CURRENT
 * priceInINR/gstPercent rather than what was actually charged at checkout if
 * the price has since changed. Any already-applied coupon/gift-card discount
 * is kept as the same absolute amount rather than re-derived, so removing an
 * item never inflates a discount the customer already redeemed.
 */
export const computeGstTaxBreakdown: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  const isItemsEdit =
    operation === 'update' &&
    Boolean(originalDoc) &&
    data.items !== undefined &&
    itemsKey(data.items) !== itemsKey(originalDoc.items)

  if (operation !== 'create' && !isItemsEdit) return data

  try {
    const siteSettings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const tax = siteSettings?.taxSettings
    const defaultGstPercent = tax?.gstRatePercent ?? 18

    const itemsWithNominal = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.items || []).map(async (item: any): Promise<TaxLineItem | null> => {
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
    const couponDiscount = data.couponApplied?.discountAmount ?? originalDoc?.couponApplied?.discountAmount ?? 0
    const giftCardDiscount =
      data.giftCardApplied?.amountApplied ?? originalDoc?.giftCardApplied?.amountApplied ?? 0
    const discountedBase = Math.max(0, nominalTotal - couponDiscount - giftCardDiscount)

    // Shipping (SAC 9968) is taxable too and was added on at checkout the same
    // way — folded in as its own line item so this snapshot matches doc.amount.
    const shippingAmount = (data.shippingAmount as number | undefined) ?? originalDoc?.shippingAmount ?? 0
    const taxableItems = shippingAmount > 0 ? [...validItems, { gstPercent: defaultGstPercent, nominal: shippingAmount }] : validItems

    const taxBreakdown = computeOrderTaxAddOn({
      items: taxableItems,
      amount: discountedBase + shippingAmount,
      defaultGstPercent,
      businessState: tax?.businessState || process.env.ZOHO_BUSINESS_STATE || 'Karnataka',
      customerState: data.shippingAddress?.state ?? originalDoc?.shippingAddress?.state,
    })

    return {
      ...data,
      taxBreakdown,
      ...(isItemsEdit ? { amount: Math.round(discountedBase + shippingAmount + taxBreakdown.totalTax) } : {}),
    }
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to compute GST tax breakdown', err })
  }

  return data
}
