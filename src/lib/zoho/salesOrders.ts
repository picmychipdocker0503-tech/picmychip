import { zohoFetch } from './auth'
import type { ZohoAddress, ZohoInvoice, ZohoLineItem, ZohoSalesOrder } from './types'

/**
 * "Ecom0001" style reference number — zero-padded to at least 4 digits,
 * growing naturally past that for larger ids (e.g. "Ecom12345"). Used both
 * when creating a sales order and when searching for an existing one
 * (findExistingSalesOrderByOrderId) — both MUST format the same way, since
 * reference_number is the idempotency key that stops a retried sync from
 * creating a duplicate sales order for the same ecommerce order.
 */
export function formatEcomReferenceNumber(orderId: string | number): string {
  return `Ecom${String(orderId).padStart(4, '0')}`
}

export type CreateZohoSalesOrderArgs = {
  customerId: string
  /** Set to the ecommerce order id — this is the idempotency key used by findExistingSalesOrderByOrderId. */
  referenceNumber: string
  date: string // yyyy-mm-dd
  placeOfSupply?: string
  gstTreatment?: string
  gstNo?: string
  lineItems: ZohoLineItem[]
  /**
   * Without these, Zoho falls back to whatever billing/shipping address is
   * currently saved on the *contact* — which drifts from this specific
   * order's actual addresses the moment a repeat customer ships to a
   * different address than what's on file (confirmed live: a contact's
   * shipping address only gets refreshed when its billing address also
   * changed, so an order shipped elsewhere silently inherited the old,
   * unrelated shipping address). Setting them here snapshots the addresses
   * this order actually used, independent of the contact's current state.
   */
  billingAddress?: ZohoAddress
  shippingAddress?: ZohoAddress
}

export async function createZohoSalesOrder(args: CreateZohoSalesOrderArgs): Promise<ZohoSalesOrder> {
  const payload = {
    customer_id: args.customerId,
    reference_number: args.referenceNumber,
    date: args.date,
    ...(args.billingAddress ? { billing_address: args.billingAddress } : {}),
    ...(args.shippingAddress ? { shipping_address: args.shippingAddress } : {}),
    // place_of_supply is needed for EVERY transaction (registered or not) —
    // it's what Zoho compares against the org's own state to decide
    // intra-state (CGST+SGST) vs inter-state (IGST). Omitting it entirely
    // for unregistered customers (as an earlier version of this fix
    // mistakenly did) makes Zoho default to intrastate regardless of the
    // customer's real state, rejecting the IGST tax_id this app had already
    // attached to the line items ("IGST cannot be applied as this is an
    // intrastate transaction") for any interstate order without a GSTIN.
    place_of_supply: args.placeOfSupply,
    gst_treatment: args.gstTreatment,
    ...(args.gstNo ? { gst_no: args.gstNo } : {}),
    line_items: args.lineItems.map((item) => ({
      item_id: item.item_id,
      name: item.name,
      description: item.description,
      rate: item.rate,
      quantity: item.quantity,
      discount: item.discount,
      hsn_or_sac: item.hsn_or_sac,
      tax_id: item.tax_id,
    })),
  }

  const data = await zohoFetch<{ salesorder: ZohoSalesOrder }>('/salesorders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return data.salesorder
}

/**
 * Idempotency guard — searches by `reference_number` (we always set it to
 * the order id) before creating anything, so a retried hook or a manual
 * admin retry never produces a duplicate sales order.
 *
 * `reference_number` alone is NOT proof of ownership: confirmed live, two
 * real orders (77, 78) got silently linked to an unrelated sales order
 * belonging to a different customer ("sri sakthi industries") that simply
 * happened to carry the same reference_number in the same Zoho org — this
 * app never created the real sales order for either order as a result. A
 * close match on `total` is a second, cheap signal against that (an
 * unrelated sales order is extremely unlikely to happen to total the same
 * amount, in rupees, as this specific order) — it doesn't require resolving
 * the Zoho contact first, which would otherwise risk creating a duplicate
 * contact before even knowing whether a sales order already exists. No
 * match within tolerance is treated the same as no sales order at all, so
 * the caller creates a fresh (correct) one instead of adopting someone
 * else's.
 */
async function findByReferenceNumber(
  referenceNumber: string,
  expectedTotal: number,
  knownSalesOrderId?: string,
): Promise<ZohoSalesOrder | undefined> {
  const params = new URLSearchParams({ reference_number: referenceNumber })
  const data = await zohoFetch<{ salesorders: ZohoSalesOrder[] }>(`/salesorders?${params.toString()}`)
  const candidates = data.salesorders ?? []

  // If we already know which sales order is ours (order.zohoSalesOrderId,
  // recorded the last time this succeeded), trust that directly rather than
  // the total-match heuristic below — confirmed live: a sales order's line
  // rates are always rebuilt from CURRENT product prices with no per-order
  // snapshot, so its `total` legitimately drifts away from `expectedTotal`
  // (order.amount, frozen at checkout) the moment a product's price changes.
  // Without this, that drift alone made the total check below fail forever
  // and created a fresh duplicate sales order on every retry (confirmed
  // live: order Ecom0025 accumulated three drafts, SO-00081/82/83, this way).
  if (knownSalesOrderId) {
    const known = candidates.find((candidate) => candidate.salesorder_id === knownSalesOrderId)
    if (known) return getZohoSalesOrder(known.salesorder_id)
  }

  // The list response is abbreviated and doesn't reliably carry `total` (or
  // even `reference_number`) — both checks need the full object, which is
  // fetched anyway for the `invoices` array on a real match. Usually exactly
  // one candidate, so this is one extra call in the common case.
  for (const candidate of candidates) {
    const full = await getZohoSalesOrder(candidate.salesorder_id)
    if (full.reference_number === referenceNumber && Math.abs(full.total - expectedTotal) < 1) {
      return full
    }
  }

  return undefined
}

export async function findExistingSalesOrderByOrderId(
  orderId: string | number,
  expectedTotal: number,
  knownSalesOrderId?: string,
): Promise<ZohoSalesOrder | undefined> {
  const formatted = await findByReferenceNumber(formatEcomReferenceNumber(orderId), expectedTotal, knownSalesOrderId)
  if (formatted) return formatted

  // Falls back to the old raw-numeric reference_number ("80", not
  // "Ecom0080") — sales orders created before the Ecom-prefixed format was
  // introduced still carry that, and this keeps them findable so a resync
  // never creates a duplicate for one of them.
  return findByReferenceNumber(String(orderId), expectedTotal, knownSalesOrderId)
}

/** Voids a sales order — used only for admin-directed one-off cleanup (e.g. a duplicate created by a since-fixed bug), never called from any automatic sync path. */
export async function voidZohoSalesOrder(salesOrderId: string): Promise<void> {
  await zohoFetch(`/salesorders/${salesOrderId}/status/void`, { method: 'POST' })
}

/**
 * Pushes a corrected line-item list to an existing (not yet invoiced, not
 * void) sales order — used when this app's own order was edited (e.g. an
 * item removed in the admin) after the sales order was already created, so
 * Zoho Books needs to be told to match. Only line_items is sent: Zoho Books'
 * update endpoint treats it as a full replace of the line items array
 * without requiring the rest of the sales order's fields to be resent.
 */
export async function updateZohoSalesOrderLineItems(
  salesOrderId: string,
  lineItems: ZohoLineItem[],
): Promise<ZohoSalesOrder> {
  const data = await zohoFetch<{ salesorder: ZohoSalesOrder }>(`/salesorders/${salesOrderId}`, {
    method: 'PUT',
    body: JSON.stringify({
      line_items: lineItems.map((item) => ({
        item_id: item.item_id,
        name: item.name,
        description: item.description,
        rate: item.rate,
        quantity: item.quantity,
        discount: item.discount,
        hsn_or_sac: item.hsn_or_sac,
        tax_id: item.tax_id,
      })),
    }),
  })
  return data.salesorder
}

/**
 * Full-detail fetch — the list response above is abbreviated and lacks the
 * `invoices` array this integration relies on to detect that a sales order
 * was accepted/converted directly in the Zoho Books UI (not just through our
 * own "Accept" action).
 */
export async function getZohoSalesOrder(salesOrderId: string): Promise<ZohoSalesOrder> {
  const data = await zohoFetch<{ salesorder: ZohoSalesOrder }>(`/salesorders/${salesOrderId}`)
  return data.salesorder
}

/**
 * Converts a sales order into an invoice — this is the "Accept" action:
 * called from the admin panel once stock/availability has been confirmed.
 * The resulting invoice's `reference_number` becomes the *sales order's*
 * number (e.g. "SO-00001"), not our ecommerce order id — so callers must
 * link back via `salesorder_id`/`getZohoSalesOrder`, not by searching
 * invoices by our own reference_number.
 */
export async function convertSalesOrderToInvoice(salesOrderId: string): Promise<ZohoInvoice> {
  const data = await zohoFetch<{ invoice: ZohoInvoice }>(`/invoices/fromsalesorder?salesorder_id=${salesOrderId}`, {
    method: 'POST',
  })
  return data.invoice
}
