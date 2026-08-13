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
  contact_persons?: { email?: string; phone?: string }[]
}

export type ZohoLineItem = {
  name: string
  description?: string
  rate: number
  quantity: number
  discount?: number
  hsn_or_sac?: string
  tax_id?: string
}

export type ZohoInvoice = {
  invoice_id: string
  invoice_number: string
  reference_number?: string
  status: string
  total: number
  invoice_url?: string
}
