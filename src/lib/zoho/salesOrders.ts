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
    // gst_treatment/gst_no are specifically about the customer's GST
    // registration, and — unlike place_of_supply — some Zoho orgs reject
    // gst_treatment outright ("Invalid Element gst_treatment", code 8)
    // unless there's a real GSTIN behind it, confirmed against a live org.
    // Same reasoning applied to contact creation (src/lib/zoho/customers.ts).
    ...(args.gstNo ? { gst_treatment: args.gstTreatment, gst_no: args.gstNo } : {}),
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
 */
export async function findExistingSalesOrderByOrderId(
  orderId: string | number,
): Promise<ZohoSalesOrder | undefined> {
  const params = new URLSearchParams({ reference_number: String(orderId) })
  const data = await zohoFetch<{ salesorders: ZohoSalesOrder[] }>(`/salesorders?${params.toString()}`)
  const match = data.salesorders?.[0]
  if (!match) return undefined
  return getZohoSalesOrder(match.salesorder_id)
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
