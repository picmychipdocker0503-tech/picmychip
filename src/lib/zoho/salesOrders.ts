import { zohoFetch } from './auth'
import type { ZohoInvoice, ZohoLineItem, ZohoSalesOrder } from './types'

export type CreateZohoSalesOrderArgs = {
  customerId: string
  /** Set to the ecommerce order id — this is the idempotency key used by findExistingSalesOrderByOrderId. */
  referenceNumber: string
  date: string // yyyy-mm-dd
  placeOfSupply?: string
  gstTreatment?: string
  gstNo?: string
  lineItems: ZohoLineItem[]
}

export async function createZohoSalesOrder(args: CreateZohoSalesOrderArgs): Promise<ZohoSalesOrder> {
  const payload = {
    customer_id: args.customerId,
    reference_number: args.referenceNumber,
    date: args.date,
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
export async function findExistingSalesOrderByOrderId(
  orderId: string | number,
  expectedTotal: number,
): Promise<ZohoSalesOrder | undefined> {
  const params = new URLSearchParams({ reference_number: String(orderId) })
  const data = await zohoFetch<{ salesorders: ZohoSalesOrder[] }>(`/salesorders?${params.toString()}`)
  const candidates = data.salesorders ?? []

  // The list response is abbreviated and doesn't reliably carry `total` (or
  // even `reference_number`) — both checks need the full object, which is
  // fetched anyway for the `invoices` array on a real match. Usually exactly
  // one candidate, so this is one extra call in the common case.
  for (const candidate of candidates) {
    const full = await getZohoSalesOrder(candidate.salesorder_id)
    if (full.reference_number === String(orderId) && Math.abs(full.total - expectedTotal) < 1) {
      return full
    }
  }

  return undefined
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
