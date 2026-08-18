export type ZohoAddress = {
  attention?: string
  address: string
  street2?: string
  city: string
  state: string
  state_code?: string
  zip: string
  country?: string
  phone?: string
}

export type ZohoContact = {
  contact_id: string
  contact_name: string
  company_name?: string
  gst_no?: string
  gst_treatment?: string
  billing_address?: ZohoAddress
  shipping_address?: ZohoAddress
  contact_persons?: { first_name?: string; last_name?: string; email?: string; phone?: string }[]
}

export type ZohoLineItem = {
  name: string
  description?: string
  rate: number
  quantity: number
  discount?: number
  hsn_or_sac?: string
  tax_id?: string
  item_id?: string
}

export type ZohoItem = {
  item_id: string
  name: string
  sku?: string
  rate: number
  hsn_or_sac?: string
  tax_id?: string
}

export type ZohoInvoice = {
  invoice_id: string
  invoice_number: string
  reference_number?: string
  customer_id?: string
  status: string
  total: number
  /** Amount still owed on this invoice — 0 once fully paid. Used to decide whether a payment still needs recording. */
  balance?: number
  invoice_url?: string
}

export type ZohoLinkedInvoice = {
  invoice_id: string
  invoice_number: string
  status: string
  total: number
  balance: number
}

export type ZohoSalesOrder = {
  salesorder_id: string
  salesorder_number: string
  reference_number?: string
  customer_id?: string
  status: string
  /** '' (not yet invoiced) | 'invoiced' | 'partially_invoiced' — set once a linked invoice exists, whether created via our "accept" action or directly in the Zoho Books UI. */
  invoiced_status?: string
  total: number
  /** Present once the sales order has been converted (fully or partially) to one or more invoices — the source of truth for detecting a Zoho-side acceptance. */
  invoices?: ZohoLinkedInvoice[]
}
