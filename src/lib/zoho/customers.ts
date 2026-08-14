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

// Some Zoho orgs reject `gst_treatment`/`gst_no`/`place_of_contact` outright
// ("Invalid Element gst_treatment", code 8) when GST/India compliance isn't
// enabled on that org — confirmed against a live org during testing. Only
// sending these when there's an actual GSTIN to report keeps contact
// creation working on orgs with and without GST enabled, rather than always
// asserting a treatment (e.g. "consumer") that not every org accepts.
//
// `includeName` defaults true (needed on create) but is set to false for
// updates — Zoho enforces a unique contact_name org-wide, and the name we'd
// compute for *this* order (from its billing address) can legitimately
// differ from what an earlier order under the same email/GSTIN/phone used
// (different capitalization, a guest checkout typo, etc.). Carrying that
// name onto an update collided with a *different* existing contact that
// already held it, rejecting an otherwise-unrelated update (e.g. one only
// changing company_name). The contact's identity/display name, once set, is
// left alone by later syncs.
const buildContactPayload = (args: FindOrCreateZohoCustomerArgs, includeName = true) => ({
  ...(includeName ? { contact_name: args.contactName } : {}),
  company_name: args.companyName || undefined,
  contact_type: 'customer',
  ...(args.gstin
    ? {
        gst_no: args.gstin,
        gst_treatment: 'business_gst',
        place_of_contact: args.billingAddress?.state_code || args.shippingAddress?.state_code || undefined,
      }
    : {}),
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

async function findByExactName(name: string): Promise<ZohoContact | undefined> {
  const params = new URLSearchParams({ search_text: name })
  const data = await zohoFetch<{ contacts: ZohoContact[] }>(`/contacts?${params.toString()}`)
  return data.contacts?.find((c) => c.contact_name.trim().toLowerCase() === name.trim().toLowerCase())
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
    body: JSON.stringify(buildContactPayload(args, false)),
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

  try {
    const created = await createContact(args)
    return { contact: created, wasCreated: true, wasUpdated: false }
  } catch (err) {
    // Zoho enforces a unique contact_name org-wide (code 3062, "already
    // exists — specify a different name") — hit for real when the same
    // person places orders under different emails/as a guest each time.
    // Rather than fail the whole sync over a naming collision, fall back to
    // reusing whatever contact already holds that exact name.
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('"code":3062')) {
      const byName = await findByExactName(args.contactName)
      if (byName) return { contact: byName, wasCreated: false, wasUpdated: false }
    }
    throw err
  }
}
