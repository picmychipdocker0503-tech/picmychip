import type { CollectionBeforeChangeHook } from 'payload'

import { computeTieredCartSubtotal } from '@/lib/computeCartSubtotal'

/**
 * Runs right after the ecommerce plugin's own `beforeChangeCart` hook (see
 * node_modules/@payloadcms/plugin-ecommerce/dist/collections/carts/beforeChange.js),
 * which sets `data.subtotal` to a flat `priceInINR × quantity` sum per line —
 * it never looks at `priceTiers`. Recomputes the same sum here, correctly
 * this time, using whichever tier the line's quantity actually qualifies
 * for. Must run BEFORE applyCartDiscounts, which nets a coupon/gift-card
 * discount off of `data.subtotal` fresh on every save — discounts need to
 * apply on top of the tier-corrected subtotal, not the flat one.
 */
export const applyTieredPricing: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data?.items || !Array.isArray(data.items)) return data

  const subtotal = await computeTieredCartSubtotal(req.payload, data.items, data.currency)
  return { ...data, subtotal }
}
