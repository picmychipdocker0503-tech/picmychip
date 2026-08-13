import { zohoFetch } from './auth'
import type { ZohoAddress, ZohoContact } from './types'

export type FindOrCreateZohoCustomerArgs = {
  /** Zoho customer id already stored against this ecommerce customer, if any — checked first. */
  existingContactId?: string
  contactName: string
  companyName?: string
  email?: string
  phone?: string
  /** GSTIN, if the customer provided one. Absence means "unregistered" — see GST logic below. */
  gstin?: string
  billingAddress?: ZohoAddress
  shippingAddress?: ZohoAddress
}

export type FindOrCreateZohoCustomerResult = {
  contact: ZohoContact
  wasCreated: boolean
  wasUpdated: boolean
}

const gstTreatmentFor = (args: FindOrCreateZohoCustomerArgs): string => {
  if (args.gstin) return 'business_gst'
  if (args.companyName) return 'business_none'
  return 'consumer'
}

const buildContactPayload = (args: FindOrCreateZohoCustomerArgs) => ({
  contact_name: args.contactName,
  company_name: args.companyName || undefined,
  contact_type: 'customer',
  gst_no: args.gstin || undefined,
  gst_treatment: gstTreatmentFor(args),
  place_of_contact: args.billingAddress?.state_code || args.shippingAddress?.state_code || undefined,
  billing_address: args.billingAddress,
  shipping_address: args.shippingAddress,
  contact_persons: args.email || args.phone ? [{ email: args.email, phone: args.phone, is_primary_contact: true }] : undefined,
})

/**
 * A contact is considered "changed" (worth a Zoho update call) if its GST/company/
 * address details drift from what we already have on file — avoids a write on
 * every single order for a repeat customer whose details haven't changed.
 */
const contactNeedsUpdate = (existing: ZohoContact, args: FindOrCreateZohoCustomerArgs): boolean => {
  if ((existing.gst_no || '') !== (args.gstin || '')) return true
  if ((existing.company_name || '') !== (args.companyName || '')) return true
  const existingLine1 = existing.billing_address?.address || ''
  const newLine1 = args.billingAddress?.address || ''
  if (newLine1 && existingLine1 !== newLine1) return true
  return false
}

async function findByContactId(contactId: string): Promise<ZohoContact | undefined> {
  try {
    const data = await zohoFetch<{ contact: ZohoContact }>(`/contacts/${contactId}`)
    return data.contact
  } catch {
    return undefined
  }
}

async function findByEmail(email: string): Promise<ZohoContact | undefined> {
  const params = new URLSearchParams({ email })
  const data = await zohoFetch<{ contacts: ZohoContact[] }>(`/contacts?${params.toString()}`)
  return data.contacts?.[0]
}

async function findByGstinOrPhone(gstin?: string, phone?: string): Promise<ZohoContact | undefined> {
  if (!gstin && !phone) return undefined
  // Zoho's contacts list endpoint has no dedicated gst_no/phone filter — falls back
  // to the general-purpose search_text param and filters the (small) result set
  // client-side. Best-effort: only used once email matching has already failed.
  const searchText = gstin || phone || ''
  const params = new URLSearchParams({ search_text: searchText })
  const data = await zohoFetch<{ contacts: ZohoContact[] }>(`/contacts?${params.toString()}`)
  return data.contacts?.find(
    (c) => (gstin && c.gst_no === gstin) || (phone && c.contact_persons?.some((p) => p.phone === phone)),
  )
}

async function createContact(args: FindOrCreateZohoCustomerArgs): Promise<ZohoContact> {
  const data = await zohoFetch<{ contact: ZohoContact }>('/contacts', {
    method: 'POST',
    body: JSON.stringify(buildContactPayload(args)),
  })
  return data.contact
}

async function updateContact(contactId: string, args: FindOrCreateZohoCustomerArgs): Promise<ZohoContact> {
  const data = await zohoFetch<{ contact: ZohoContact }>(`/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(buildContactPayload(args)),
  })
  return data.contact
}

/**
 * Find-or-create with the priority order the ecommerce integration requires:
 * stored Zoho customer id → email → GSTIN → phone. Never creates a duplicate
 * contact when any of those already resolve to one — updates it in place instead
 * when its GST/company/address details have drifted.
 */
export async function findOrCreateZohoCustomer(
  args: FindOrCreateZohoCustomerArgs,
): Promise<FindOrCreateZohoCustomerResult> {
  let existing: ZohoContact | undefined

  if (args.existingContactId) existing = await findByContactId(args.existingContactId)
  if (!existing && args.email) existing = await findByEmail(args.email)
  if (!existing) existing = await findByGstinOrPhone(args.gstin, args.phone)

  if (existing) {
    if (contactNeedsUpdate(existing, args)) {
      const updated = await updateContact(existing.contact_id, args)
      return { contact: updated, wasCreated: false, wasUpdated: true }
    }
    return { contact: existing, wasCreated: false, wasUpdated: false }
  }

  const created = await createContact(args)
  return { contact: created, wasCreated: true, wasUpdated: false }
}
