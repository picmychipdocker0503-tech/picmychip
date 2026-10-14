import type { Payload } from 'payload'
import type { Product, Variant } from '@/payload-types'

import {
  bulkPricingSettingsFromFlags,
  getEffectivePriceTiers,
  resolveTieredUnitPrice,
  type BulkPricingMode,
  type PriceTier,
} from '@/lib/priceTiers'

type CartItemLike = {
  product?: number | string | { id: number | string } | null
  variant?: number | string | { id: number | string } | null
  quantity?: number | null
}

/**
 * Recomputes a cart's subtotal fresh from each item's *current* price/tiers,
 * rather than trusting a stored `cart.subtotal` — that field is only a
 * snapshot, recomputed by applyTieredPricing.ts when the cart document
 * itself is next saved. A tier edited (or removed) in admin after a cart was
 * last touched leaves its stored subtotal stale until the customer changes
 * quantity again. Called at payment-initiation time (PayU/Zoho
 * initiatePayment.ts) so the amount actually charged can never be stale,
 * and by applyTieredPricing.ts itself so the two never drift apart.
 */
export async function computeTieredCartSubtotal(
  payload: Payload,
  items: CartItemLike[] | null | undefined,
  currency: string,
): Promise<number> {
  if (!items || !Array.isArray(items)) return 0

  const priceField = `priceIn${currency}`
  // Tiers are INR-only (see AddToCart.tsx) — any other currency is flat-priced.
  const settings =
    currency === 'INR'
      ? bulkPricingSettingsFromFlags(
          await payload.findGlobal({ slug: 'feature-flags', depth: 0, overrideAccess: true }).catch(() => null),
        )
      : { enabled: false }
  let subtotal = 0

  const getProduct = (id: number | string) =>
    payload.findByID({
      id,
      collection: 'products',
      depth: 0,
      select: { [priceField]: true, priceTiers: true, bulkPricingMode: true },
    })

  for (const item of items) {
    const quantity = item.quantity ?? 0

    if (item.variant) {
      const id = typeof item.variant === 'object' ? item.variant.id : item.variant
      const variant = await payload.findByID({
        id,
        collection: 'variants',
        depth: 0,
        select: { [priceField]: true, priceTiers: true, product: true },
      })
      const parentId = typeof variant?.product === 'object' ? variant.product?.id : variant?.product
      const parent = parentId ? await getProduct(parentId) : null
      const price = variant?.[priceField as keyof Variant] as number | undefined
      const tiers = getEffectivePriceTiers({
        basePriceInINR: price,
        ownTiers: (variant?.priceTiers ?? undefined) as PriceTier[] | undefined,
        mode: parent?.bulkPricingMode as BulkPricingMode | undefined,
        settings,
      })
      subtotal += resolveTieredUnitPrice(price ?? 0, tiers, quantity) * quantity
    } else if (item.product) {
      const id = typeof item.product === 'object' ? item.product.id : item.product
      const product = await getProduct(id)
      const price = product?.[priceField as keyof Product] as number | undefined
      const tiers = getEffectivePriceTiers({
        basePriceInINR: price,
        ownTiers: (product?.priceTiers ?? undefined) as PriceTier[] | undefined,
        mode: product?.bulkPricingMode as BulkPricingMode | undefined,
        settings,
      })
      subtotal += resolveTieredUnitPrice(price ?? 0, tiers, quantity) * quantity
    }
  }

  return subtotal
}
