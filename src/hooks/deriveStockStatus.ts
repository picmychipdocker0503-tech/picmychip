import type { CollectionBeforeChangeHook } from 'payload'

const DEFAULT_LOW_STOCK_THRESHOLD = 5

/**
 * Auto-derives stockStatus from inventory, except when explicitly set to
 * "backorder" — that's a manual business decision (still sellable despite
 * zero physical stock) that can't be inferred from the inventory count alone.
 */
export const deriveStockStatus: CollectionBeforeChangeHook = ({ data }) => {
  if (data?.stockStatus === 'backorder') {
    return data
  }

  const inventory = typeof data?.inventory === 'number' ? data.inventory : undefined

  if (inventory === undefined) {
    return data
  }

  const lowStockThreshold =
    typeof data?.lowStockThreshold === 'number' ? data.lowStockThreshold : DEFAULT_LOW_STOCK_THRESHOLD

  const stockStatus =
    inventory <= 0 ? 'out-of-stock' : inventory <= lowStockThreshold ? 'low-stock' : 'in-stock'

  return {
    ...data,
    stockStatus,
  }
}
