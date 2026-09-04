import type { Payload } from 'payload'
import type { Product, Variant } from '@/payload-types'

import { resolveTieredUnitPrice, type PriceTier } from '@/lib/priceTiers'

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
  let subtotal = 0

  for (const item of items) {
    const quantity = item.quantity ?? 0

    if (item.variant) {
      const id = typeof item.variant === 'object' ? item.variant.id : item.variant
      const variant = await payload.findByID({
        id,
        collection: 'variants',
        depth: 0,
        select: { [priceField]: true, priceTiers: true },
      })
      const tiers = (variant?.priceTiers ?? undefined) as PriceTier[] | undefined
      const price = variant?.[priceField as keyof Variant] as number | undefined
      subtotal += resolveTieredUnitPrice(price ?? 0, tiers, quantity) * quantity
    } else if (item.product) {
      const id = typeof item.product === 'object' ? item.product.id : item.product
      const product = await payload.findByID({
        id,
        collection: 'products',
        depth: 0,
        select: { [priceField]: true, priceTiers: true },
      })
      const tiers = (product?.priceTiers ?? undefined) as PriceTier[] | undefined
      const price = product?.[priceField as keyof Product] as number | undefined
      subtotal += resolveTieredUnitPrice(price ?? 0, tiers, quantity) * quantity
    }
  }

  return subtotal
}
