import { zohoFetch } from './auth'
import type { ZohoItem } from './types'

export type FindOrCreateZohoItemArgs = {
  /** Cached item_id from Products.zohoItemId, if this product has synced before — checked first. */
  zohoItemId?: string
  name: string
  sku?: string
  description?: string
  hsnCode?: string
  taxId?: string
  rate: number
}

export type FindOrCreateZohoItemResult = {
  itemId: string
  wasCreated: boolean
}

async function findById(itemId: string): Promise<ZohoItem | undefined> {
  try {
    const data = await zohoFetch<{ item: ZohoItem }>(`/items/${itemId}`)
    return data.item
  } catch {
    // Stale id — the item was deleted, or (has happened before in this org)
    // the connected Zoho org changed out from under a previously-synced id.
    return undefined
  }
}

async function findBySku(sku: string): Promise<ZohoItem | undefined> {
  const params = new URLSearchParams({ sku })
  const data = await zohoFetch<{ items: ZohoItem[] }>(`/items?${params.toString()}`)
  return data.items?.[0]
}

async function findByName(name: string): Promise<ZohoItem | undefined> {
  const params = new URLSearchParams({ name })
  const data = await zohoFetch<{ items: ZohoItem[] }>(`/items?${params.toString()}`)
  return data.items?.find((item) => item.name === name) ?? data.items?.[0]
}

/**
 * An item found by SKU/name/cached-id is only worth reusing as-is if it
 * actually carries this product's current HSN/rate/SKU — otherwise reuse
 * silently perpetuates whatever incomplete data the item happened to have
 * when it was first created (confirmed live: items created before a
 * product's HSN was populated stayed HSN-blank forever, since the original
 * version of this function only ever set fields on brand-new items). Tax_id
 * is deliberately excluded — confirmed this org never persists it on the
 * item record regardless of what's sent, so comparing it would trigger a
 * pointless update on every single call.
 */
function itemNeedsUpdate(existing: ZohoItem, args: FindOrCreateZohoItemArgs): boolean {
  if (args.hsnCode && (existing.hsn_or_sac || '') !== args.hsnCode) return true
  if (args.sku && (existing.sku || '') !== args.sku) return true
  if (typeof args.rate === 'number' && existing.rate !== args.rate) return true
  // Catches items already synced with the old full-spec-dump description —
  // the next order for one of those corrects it to the new short form (or
  // clears it to blank). Checked whenever description was explicitly passed
  // (including '' to clear) — args.description undefined means the caller
  // has no opinion on it, so it's left alone rather than treated as "clear".
  if (args.description !== undefined && (existing.description || '') !== args.description) return true
  return false
}

async function updateItem(itemId: string, args: FindOrCreateZohoItemArgs): Promise<ZohoItem> {
  const data = await zohoFetch<{ item: ZohoItem }>(`/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(buildItemPayload(args)),
  })
  return data.item
}

/**
 * Searches by SKU first (this catalog's most reliable stable identifier),
 * falling back to an exact name match — product titles here already double
 * as manufacturer part numbers (see searchIndex.ts), so title is the
 * closest thing to an MPN this catalog has, without adding a new field.
 */
async function findExistingItem(args: FindOrCreateZohoItemArgs): Promise<ZohoItem | undefined> {
  if (args.sku) {
    const bySku = await findBySku(args.sku)
    if (bySku) return bySku
  }
  return findByName(args.name)
}

function buildItemPayload(args: FindOrCreateZohoItemArgs) {
  return {
    name: args.name,
    sku: args.sku || undefined,
    // Passed through as-is, not `|| undefined` — an explicit '' is what
    // actually clears an existing item's description; collapsing it to
    // undefined here would drop the key entirely and leave a previously-set
    // long description in place instead of clearing it.
    description: args.description,
    hsn_or_sac: args.hsnCode || undefined,
    // Confirmed live against the org: this org doesn't persist a default
    // tax_id on the item record itself (comes back blank on the created
    // item regardless of this field or item_tax_preferences) — sent anyway
    // since it's harmless and may take effect on a differently-configured
    // org. This does NOT affect actual GST calculation: every Sales Order
    // line item also carries its own explicit tax_id (see
    // buildZohoLineItems/createZohoSalesOrder), which is what Zoho actually
    // taxes the document with, independent of the item's own default.
    tax_id: args.taxId || undefined,
    rate: args.rate,
    unit: 'pcs',
    product_type: 'goods',
    // No purchase_rate — this catalog has no cost-price field to source it
    // from. item_type: 'sales' (not the guessed 'sales_and_purchase' — Zoho
    // rejected that with "Invalid value passed for item_type", confirmed
    // live; 'inventory' also fails on orgs without inventory tracking
    // enabled) matches a sales-only item with no purchase-side tracking.
    item_type: 'sales',
  }
}

/**
 * Find-or-create with the priority order the sales-order sync requires:
 * cached Products.zohoItemId → SKU → name. Never creates a duplicate Zoho
 * item when any of those already resolve to one.
 *
 * Zoho's exact duplicate-item error signature isn't confirmed against a live
 * org the way the contacts module's `code 3062` is — rather than guess one,
 * ANY creation failure triggers a re-search first: if a concurrent request
 * already created the item, the re-search finds it and that's used instead
 * of failing. Only a failure that persists through the re-search propagates.
 */
export async function findOrCreateZohoItem(args: FindOrCreateZohoItemArgs): Promise<FindOrCreateZohoItemResult> {
  if (args.zohoItemId) {
    const cached = await findById(args.zohoItemId)
    if (cached) {
      if (itemNeedsUpdate(cached, args)) await updateItem(cached.item_id, args)
      return { itemId: cached.item_id, wasCreated: false }
    }
  }

  const existing = await findExistingItem(args)
  if (existing) {
    if (itemNeedsUpdate(existing, args)) await updateItem(existing.item_id, args)
    return { itemId: existing.item_id, wasCreated: false }
  }

  try {
    const data = await zohoFetch<{ item: ZohoItem }>('/items', {
      method: 'POST',
      body: JSON.stringify(buildItemPayload(args)),
    })
    return { itemId: data.item.item_id, wasCreated: true }
  } catch (err) {
    const recovered = await findExistingItem(args)
    if (recovered) return { itemId: recovered.item_id, wasCreated: false }

    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Unable to create Zoho item: ${args.name}. Reason: ${message}`)
  }
}
