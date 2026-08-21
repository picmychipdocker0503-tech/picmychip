import type { Payload } from 'payload'

import { computeOrderTaxAddOn, type TaxLineItem } from '@/lib/taxCalculation'

type CartLikeItem = {
  product?: number | { id: number; priceInINR?: number | null; gstPercent?: number | null } | null
  variant?: number | { id: number; priceInINR?: number | null } | null
  quantity?: number | null
}

/**
 * Resolves each cart item's GST-exclusive base price and gstPercent into
 * TaxLineItems, fetching the product/variant if the cart wasn't populated
 * deeply enough. Mirrors the same product/variant price-resolution fallback
 * as computeGstTaxBreakdown.ts's order-snapshot hook, so checkout-time and
 * post-order-creation tax math stay consistent.
 */
export async function resolveTaxLineItems(
  payload: Payload,
  items: CartLikeItem[],
  defaultGstPercent: number,
): Promise<TaxLineItem[]> {
  const resolved = await Promise.all(
    items.map(async (item): Promise<TaxLineItem | null> => {
      const quantity = item.quantity ?? 1

      const product =
        item.product && typeof item.product === 'object'
          ? item.product
          : item.product
            ? await payload.findByID({ collection: 'products', id: item.product, depth: 0, overrideAccess: true })
            : null
      if (!product) return null

      const variant =
        item.variant && typeof item.variant === 'object'
          ? item.variant
          : item.variant
            ? await payload.findByID({ collection: 'variants', id: item.variant, depth: 0, overrideAccess: true })
            : null

      const unitPrice = (variant?.priceInINR ?? product.priceInINR ?? 0) as number
      const gstPercent = (product.gstPercent ?? defaultGstPercent) as number

      return { gstPercent, nominal: unitPrice * quantity }
    }),
  )

  return resolved.filter((item): item is TaxLineItem => Boolean(item))
}

/**
 * Computes the GST-inclusive amount to actually charge for a discounted
 * base subtotal (e.g. cart.subtotal, which is already GST-exclusive and net
 * of coupon/gift-card discounts). Returns the tax add-on breakdown alongside
 * the final inclusive amount.
 */
export async function computeCheckoutTotal(args: {
  payload: Payload
  items: CartLikeItem[]
  baseSubtotal: number
  shippingAmount?: number
  businessState?: string | null
  customerState?: string | null
  defaultGstPercent: number
}) {
  const { payload, items, baseSubtotal, shippingAmount = 0, businessState, customerState, defaultGstPercent } = args

  const lineItems = await resolveTaxLineItems(payload, items, defaultGstPercent)
  const taxableLineItems =
    shippingAmount > 0
      ? [...lineItems, { gstPercent: defaultGstPercent, nominal: shippingAmount }]
      : lineItems
  const taxableAmount = baseSubtotal + shippingAmount

  const taxBreakdown = computeOrderTaxAddOn({
    items: taxableLineItems,
    amount: taxableAmount,
    defaultGstPercent,
    businessState,
    customerState,
  })

  return {
    finalAmount: taxableAmount + taxBreakdown.totalTax,
    taxBreakdown,
  }
}
