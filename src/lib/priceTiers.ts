// maxQuantity is authoritative for pricing, not just display: a tier only
// applies within [minQuantity, maxQuantity]. A non-last tier left blank is
// implicitly bounded by the next tier's minQuantity (so admins don't have to
// keep two tiers' numbers in sync by hand) — but the LAST (highest-min) tier
// has no "next" to borrow a bound from, so leaving ITS maxQuantity blank
// means it applies to nothing at all, not "open-ended": a top tier needs an
// explicit maxQuantity to actually price anything. Any quantity not covered
// by an active tier (below the lowest minQuantity, in a gap, or above the
// highest tier's range) falls back to the flat base price.
export type PriceTier = { minQuantity: number; maxQuantity?: number | null; priceInINR: number }

/**
 * The unit price actually charged for `quantity` units — the highest tier
 * whose effective [minQuantity, maxQuantity] range contains it, or the flat
 * base price when there are no tiers, or none of them cover this quantity.
 */
export function resolveTieredUnitPrice(
  basePriceInINR: number,
  tiers: PriceTier[] | null | undefined,
  quantity: number,
): number {
  if (!tiers || tiers.length === 0) return basePriceInINR

  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity)
  let applicable: PriceTier | undefined

  sorted.forEach((tier, index) => {
    const next = sorted[index + 1]
    const isLast = !next

    let effectiveMax = tier.maxQuantity ?? undefined
    if (effectiveMax == null) {
      if (isLast) return // top tier with no explicit max never applies
      effectiveMax = next.minQuantity - 1
    }

    if (quantity >= tier.minQuantity && quantity <= effectiveMax) applicable = tier
  })

  return applicable ? applicable.priceInINR : basePriceInINR
}

/**
 * The lowest tier's minQuantity doubles as both the enforced minimum
 * purchase quantity and the step between valid quantities — matching a
 * reel/bulk-only product's "Minimum: 4000 Multiple: 4000" (a single value,
 * not two independent settings). No tiers -> step of 1 (today's behavior).
 */
export function getTierStep(tiers: PriceTier[] | null | undefined): number {
  if (!tiers || tiers.length === 0) return 1
  return Math.min(...tiers.map((tier) => tier.minQuantity))
}

/**
 * Rounds `next` to the nearest step-multiple at or above the step (never
 * below it — there's no "half a reel"), then caps at inventory, same as the
 * inventory-capping behavior already in AddToCart.tsx/CartModal.tsx.
 */
export function clampTieredQuantity(
  next: number,
  tiers: PriceTier[] | null | undefined,
  inventory?: number,
): number {
  const step = getTierStep(tiers)
  const rounded = Math.round((Math.floor(next) || step) / step) * step
  const clamped = Math.max(step, rounded)
  return inventory && inventory > 0 ? Math.min(inventory, clamped) : clamped
}
