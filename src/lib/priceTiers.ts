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

export type BulkPricingMode = 'default' | 'custom' | 'off'

/** A store-wide default tier: a % discount off each product's own base price. */
export type GlobalBulkTier = { minQuantity: number; discountPercent: number }

export type BulkPricingSettings = {
  /** Master switch (Feature Flags → bulkPricing). Off = flat pricing everywhere. */
  enabled?: boolean | null
  /** Store-wide default tiers (Feature Flags → bulkPricingTiers). */
  tiers?: GlobalBulkTier[] | null
}

/**
 * Turns the store-wide %-off tiers into absolute PriceTiers for one base
 * price, in the same shape resolveTieredUnitPrice already understands.
 * Unlike admin-entered product tiers, the highest global tier is open-ended
 * (DigiKey-style "1,000+"), so it gets an explicit huge maxQuantity. A
 * leading 1-unit tier at the base price is added when the first break is
 * above 1 — otherwise getTierStep would turn "10+ gets 5% off" into "you
 * must buy in multiples of 10".
 */
export function buildGlobalPriceTiers(basePriceInINR: number, tiers: GlobalBulkTier[] | null | undefined): PriceTier[] {
  const sorted = (tiers ?? [])
    .filter((tier) => tier.minQuantity >= 1 && tier.discountPercent >= 0)
    .sort((a, b) => a.minQuantity - b.minQuantity)
  if (!sorted.length || basePriceInINR <= 0) return []

  const result: PriceTier[] = sorted.map((tier, index) => ({
    minQuantity: tier.minQuantity,
    maxQuantity: index === sorted.length - 1 ? Number.MAX_SAFE_INTEGER : undefined,
    priceInINR: Math.round(basePriceInINR * (1 - Math.min(tier.discountPercent, 100) / 100)),
  }))

  if (result[0].minQuantity > 1) result.unshift({ minQuantity: 1, priceInINR: basePriceInINR })
  return result
}

/**
 * The single place that decides which tiers price a product/variant — used
 * by the authoritative server subtotal (computeCartSubtotal.ts) and every
 * client-side preview, so they can never disagree:
 * - global flag off, or product mode 'off' → no tiers (flat price)
 * - product/variant has its own tiers → those (both 'default' and 'custom')
 * - mode 'default' with no own tiers → store-wide defaults
 */
export function getEffectivePriceTiers(args: {
  basePriceInINR: number | null | undefined
  ownTiers: PriceTier[] | null | undefined
  mode?: BulkPricingMode | null
  settings?: BulkPricingSettings | null
}): PriceTier[] {
  const { basePriceInINR, ownTiers, mode, settings } = args
  if (settings?.enabled === false || mode === 'off') return []
  if (ownTiers && ownTiers.length) return ownTiers
  if (mode === 'custom' || typeof basePriceInINR !== 'number') return []
  return buildGlobalPriceTiers(basePriceInINR, settings?.tiers)
}

type TierSource = { priceInINR?: number | null; priceTiers?: PriceTier[] | null }

/**
 * getEffectivePriceTiers for a cart line / product page selection: a
 * variant's own price and tiers win, but the mode always comes from the
 * parent product (variants have no mode of their own).
 */
export function getItemPriceTiers(
  product: (TierSource & { bulkPricingMode?: BulkPricingMode | null }) | null | undefined,
  variant: TierSource | null | undefined,
  settings: BulkPricingSettings | null | undefined,
): PriceTier[] {
  const source = variant ?? product
  return getEffectivePriceTiers({
    basePriceInINR: source?.priceInINR,
    ownTiers: source?.priceTiers,
    mode: product?.bulkPricingMode,
    settings,
  })
}

/** Reads the bulk pricing settings off a (possibly partial) feature-flags global. */
export function bulkPricingSettingsFromFlags(
  flags: { bulkPricing?: boolean | null; bulkPricingTiers?: GlobalBulkTier[] | null } | null | undefined,
): BulkPricingSettings {
  return { enabled: flags?.bulkPricing ?? true, tiers: flags?.bulkPricingTiers ?? [] }
}
