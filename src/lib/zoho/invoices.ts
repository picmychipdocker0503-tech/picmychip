import { getZohoApiDomain, zohoFetch, zohoFetchBinary } from './auth'
import type { ZohoInvoice, ZohoLineItem } from './types'

export type CreateZohoInvoiceArgs = {
  customerId: string
  /** Set to the ecommerce order id — this is the idempotency key used by findExistingInvoiceByOrderId. */
  referenceNumber: string
  date: string // yyyy-mm-dd
  placeOfSupply?: string
  gstTreatment?: string
  gstNo?: string
  lineItems: ZohoLineItem[]
  // Deliberately no billing/shipping address here — see the comment on
  // createZohoInvoice below for why. The contact (customer) record already
  // carries the address; the invoice inherits it from there.
}

/**
 * Idempotency guard — searches by `reference_number` (we always set it to the
 * order id) before creating anything, so a retried hook or a manual admin
 * retry never produces a duplicate invoice. Fetches the full invoice (not
 * just the abbreviated list-response object, which omits fields like
 * `customer_id`/`balance` that recordPaymentIfNeeded relies on) once a match
 * is found.
 */
export async function findExistingInvoiceByOrderId(orderId: string | number): Promise<ZohoInvoice | undefined> {
  const params = new URLSearchParams({ reference_number: String(orderId) })
  const data = await zohoFetch<{ invoices: ZohoInvoice[] }>(`/invoices?${params.toString()}`)
  const match = data.invoices?.[0]
  if (!match) return undefined
  return getZohoInvoice(match.invoice_id)
}

/**
 * Creates the invoice. Deliberately does NOT send an inline billing_address/
 * shipping_address override — empirically, Zoho Books' /invoices create
 * endpoint rejects any billing_address object whose serialized size exceeds
 * ~100 characters ("Please ensure that the billing_address has less than
 * 100 characters"), which any real multi-field address trivially exceeds.
 * The contact's own address (set via /contacts by findOrCreateZohoCustomer,
 * which has no such limit) is what the invoice inherits instead.
 */
export async function createZohoInvoice(args: CreateZohoInvoiceArgs): Promise<ZohoInvoice> {
  const payload = {
    customer_id: args.customerId,
    reference_number: args.referenceNumber,
    date: args.date,
    place_of_supply: args.placeOfSupply,
    gst_treatment: args.gstTreatment,
    gst_no: args.gstNo,
    line_items: args.lineItems.map((item) => ({
      name: item.name,
      description: item.description,
      rate: item.rate,
      quantity: item.quantity,
      discount: item.discount,
      hsn_or_sac: item.hsn_or_sac,
      tax_id: item.tax_id,
    })),
  }

  const data = await zohoFetch<{ invoice: ZohoInvoice }>('/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const invoice = data.invoice

  // Marks the invoice as finalized/sent in Zoho's own bookkeeping without
  // triggering Zoho's customer-facing email — this app sends its own order
  // confirmation email separately (see sendOrderLifecycleEmails). Best-effort:
  // the invoice itself is already created at this point either way.
  try {
    await zohoFetch(`/invoices/${invoice.invoice_id}/status/sent`, { method: 'POST' })
  } catch {
    // Non-fatal — invoice exists and is retrievable even if this status flip fails.
  }

  return invoice
}

export async function getZohoInvoice(invoiceId: string): Promise<ZohoInvoice> {
  const data = await zohoFetch<{ invoice: ZohoInvoice }>(`/invoices/${invoiceId}`)
  return data.invoice
}

/**
 * Corrects an already-created invoice's line items (e.g. after a rate-
 * calculation bug fix) without disturbing its invoice_id/invoice_number —
 * unlike createZohoInvoice, this is for fixing a specific existing invoice,
 * not the normal creation path. Only safe to call before any payment has
 * been recorded against the invoice.
 */
export async function updateZohoInvoiceLineItems(
  invoiceId: string,
  lineItems: ZohoLineItem[],
  reason: string,
): Promise<ZohoInvoice> {
  const data = await zohoFetch<{ invoice: ZohoInvoice }>(`/invoices/${invoiceId}`, {
    method: 'PUT',
    body: JSON.stringify({
      reason,
      line_items: lineItems.map((item) => ({
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
  return data.invoice
}

/**
 * Downloads the actual PDF Zoho Books generates for this invoice — the same
 * document you'd get from the Zoho Books web app, not a re-derivation of it.
 * Uses Zoho's bulk-export endpoint with a single invoice id, since Zoho
 * Books has no single-invoice `/pdf` route.
 */
export async function getInvoicePdfBytes(invoiceId: string): Promise<Buffer> {
  const params = new URLSearchParams({ invoice_ids: invoiceId })
  return zohoFetchBinary(`/invoices/pdf?${params.toString()}`)
}

/**
 * Best-effort admin-facing link to open the invoice in the Zoho Books web
 * app. Zoho's create/get invoice response doesn't reliably include a public
 * URL, so this falls back to the standard Zoho Books app deep link when
 * `invoice_url` isn't present. Verify this resolves correctly against your
 * Zoho org/region during setup — see the Zoho testing steps.
 */
export function getInvoicePdfUrl(invoice: ZohoInvoice): string {
  if (invoice.invoice_url) return invoice.invoice_url
  const appDomain = getZohoApiDomain().replace('www.zohoapis', 'books.zoho')
  return `${appDomain}/app/${process.env.ZOHO_ORGANIZATION_ID || ''}#/invoices/${invoice.invoice_id}`
}
