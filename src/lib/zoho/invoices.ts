import { getZohoApiDomain, zohoFetch } from './auth'
import type { ZohoAddress, ZohoInvoice, ZohoLineItem } from './types'

export type CreateZohoInvoiceArgs = {
  customerId: string
  /** Set to the ecommerce order id — this is the idempotency key used by findExistingInvoiceByOrderId. */
  referenceNumber: string
  date: string // yyyy-mm-dd
  placeOfSupply?: string
  gstTreatment?: string
  gstNo?: string
  lineItems: ZohoLineItem[]
  billingAddress?: ZohoAddress
  shippingAddress?: ZohoAddress
}

/**
 * Idempotency guard — searches by `reference_number` (we always set it to the
 * order id) before creating anything, so a retried hook or a manual admin
 * retry never produces a duplicate invoice.
 */
export async function findExistingInvoiceByOrderId(orderId: string | number): Promise<ZohoInvoice | undefined> {
  const params = new URLSearchParams({ reference_number: String(orderId) })
  const data = await zohoFetch<{ invoices: ZohoInvoice[] }>(`/invoices?${params.toString()}`)
  return data.invoices?.[0]
}

export async function createZohoInvoice(args: CreateZohoInvoiceArgs): Promise<ZohoInvoice> {
  const payload = {
    customer_id: args.customerId,
    reference_number: args.referenceNumber,
    date: args.date,
    place_of_supply: args.placeOfSupply,
    gst_treatment: args.gstTreatment,
    gst_no: args.gstNo,
    billing_address: args.billingAddress,
    shipping_address: args.shippingAddress,
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
