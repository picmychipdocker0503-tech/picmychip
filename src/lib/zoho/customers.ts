import { zohoFetch } from './auth'
import type { ZohoAddress, ZohoContact } from './types'

export type FindOrCreateZohoCustomerArgs = {
  /** Zoho customer id already stored against this ecommerce customer, if any — checked first. */
  existingContactId?: string
  /** The primary contact person's full name (e.g. "Keerthan Kumar P") — never itself the Display Name; see getZohoDisplayName. */
  contactName: string
  firstName?: string
  lastName?: string
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

/**
 * Zoho Books' contact_name field is what its own UI labels "Display Name" —
 * distinct from company_name (a separate field) and from the primary
 * contact person's own name (contact_persons[].first_name/last_name).
 * Company name wins whenever present; the primary contact's name is only
 * the fallback for individual (no-company) customers. Centralized here so
 * every caller (create, update, sales-order sync) computes it identically —
 * never duplicate this ternary elsewhere.
 */
export function getZohoDisplayName(args: { companyName?: string | null; contactName: string }): string {
  const company = (args.companyName || '').trim()
  if (company) return company
  return (args.contactName || '').trim()
}

export function getZohoGstTreatment(args: {
  companyName?: string | null
  gstin?: string | null
}): 'consumer' | 'business_none' | 'business_gst' {
  if ((args.gstin || '').trim()) return 'business_gst'
  if ((args.companyName || '').trim()) return 'business_none'
  return 'consumer'
}

// Contacts follow the storefront billing identity: company + GSTIN means a
// registered business, company without GSTIN means unregistered business, and
// no company/GSTIN means consumer. The display name remains company-first,
// falling back to the customer's own name.
//
// `displayNameOverride` lets a caller omit contact_name by passing `null`
// when Zoho reports a Display Name collision. Email/phone must never be used
// as a Display Name suffix; display names are always company name or customer
// name only.
const buildContactPayload = (args: FindOrCreateZohoCustomerArgs, displayNameOverride?: string | null) => {
  const contactName = displayNameOverride === null ? undefined : (displayNameOverride ?? getZohoDisplayName(args))

  return {
    ...(contactName ? { contact_name: contactName } : {}),
    company_name: args.companyName || undefined,
    contact_type: 'customer',
    gst_treatment: getZohoGstTreatment(args),
    ...(args.gstin ? { gst_no: args.gstin } : {}),
    place_of_contact: args.billingAddress?.state_code || args.shippingAddress?.state_code || undefined,
    billing_address: args.billingAddress,
    shipping_address: args.shippingAddress,
    contact_persons:
      args.email || args.phone || args.firstName || args.lastName
        ? [
            {
              first_name: args.firstName || undefined,
              last_name: args.lastName || undefined,
              email: args.email,
              phone: args.phone,
              is_primary_contact: true,
            },
          ]
        : undefined,
  }
}

/**
 * A contact is considered "changed" (worth a Zoho update call) if its
 * Display Name (recalculated fresh from company/contact name every time —
 * never trust the existing Zoho value), GST, company, or address details
 * drift from what we already have on file — avoids a write on every single
 * order for a repeat customer whose details haven't changed.
 */
const contactNeedsUpdate = (
  existing: ZohoContact,
  args: FindOrCreateZohoCustomerArgs,
  displayNameOverride?: string | null,
): boolean => {
  const displayName = displayNameOverride === null ? existing.contact_name : (displayNameOverride ?? getZohoDisplayName(args))
  if (existing.contact_name.trim().toLowerCase() !== displayName.toLowerCase()) return true
  if ((existing.gst_no || '') !== (args.gstin || '')) return true
  if ((existing.company_name || '') !== (args.companyName || '')) return true
  const existingLine1 = existing.billing_address?.address || ''
  const newLine1 = args.billingAddress?.address || ''
  if (newLine1 && existingLine1 !== newLine1) return true
  return false
}

/**
 * A found-by-email contact represents a genuinely different billing identity
 * (not the same customer's info evolving) when it already carries a GSTIN
 * that conflicts with — or is simply absent from — this order's own
 * details. GSTIN specifically, not company name: a GSTIN uniquely
 * identifies a registered legal entity, so a mismatch is a strong signal of
 * two different real customers sharing a login. Company name alone is not
 * — the same customer legitimately adds/removes a company name over time
 * (see getZohoDisplayName's Display Name rule), and that must update the
 * existing contact in place, not spawn a duplicate. Presence-only asymmetry
 * on GSTIN counts too: reusing a GST-registered contact for a no-GST order
 * would either strand the old GSTIN on it (Zoho leaves omitted fields
 * unchanged on update) or wipe out real GST data for whoever the *other*
 * order belongs to.
 */
function identityConflicts(existing: ZohoContact, args: FindOrCreateZohoCustomerArgs): boolean {
  const existingGstin = (existing.gst_no || '').trim()
  const argsGstin = (args.gstin || '').trim()
  return Boolean(existingGstin && existingGstin !== argsGstin)
}

function isZohoDuplicateContactError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.includes('"code":3062') || message.includes('code:3062') || message.includes('already exists')
}

function extractDuplicateCustomerName(err: unknown): string | undefined {
  let message = err instanceof Error ? err.message : String(err)
  const jsonBody = message.match(/\{.*\}$/)?.[0]
  if (jsonBody) {
    try {
      const parsed = JSON.parse(jsonBody) as { message?: string }
      message = parsed.message || message
    } catch {
      // Fall back to the raw Error message below.
    }
  }
  return message.match(/customer\s+["']([^"']+)["']\s+already exists/i)?.[1]
}

function extractEmail(text?: string): string | undefined {
  return text?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
}

function normalizeText(value?: string | null): string {
  return (value || '').trim().toLowerCase()
}

function normalizePhone(value?: string | null): string {
  return (value || '').replace(/\D/g, '')
}

function contactHasEmail(contact: ZohoContact, email?: string): boolean {
  const normalizedEmail = normalizeText(email)
  if (!normalizedEmail) return false
  return contact.contact_persons?.some((person) => normalizeText(person.email) === normalizedEmail) ?? false
}

function contactHasPhone(contact: ZohoContact, phone?: string): boolean {
  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) return false
  return (
    contact.contact_persons?.some((person) => normalizePhone(person.phone).endsWith(normalizedPhone) || normalizedPhone.endsWith(normalizePhone(person.phone))) ??
    false
  )
}

async function getFullContact(contact: ZohoContact): Promise<ZohoContact> {
  return (await findByContactId(contact.contact_id)) || contact
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
  const candidates: ZohoContact[] = []

  for (const filterBy of ['Status.All', 'Status.Active', 'Status.Inactive']) {
    const params = new URLSearchParams({ email, filter_by: filterBy })
    const data = await zohoFetch<{ contacts: ZohoContact[] }>(`/contacts?${params.toString()}`)
    candidates.push(...(data.contacts ?? []))
  }

  candidates.push(...(await findBySearchText(email)))

  const seen = new Set<string>()
  for (const candidate of candidates) {
    if (seen.has(candidate.contact_id)) continue
    seen.add(candidate.contact_id)

    const full = await getFullContact(candidate)
    if (contactHasEmail(full, email)) return full
  }

  return undefined
}

async function findByGstinOrPhone(gstin?: string, phone?: string): Promise<ZohoContact | undefined> {
  if (!gstin && !phone) return undefined
  // Zoho's contacts list endpoint has no dedicated gst_no/phone filter — falls back
  // to the general-purpose search_text param and filters the (small) result set
  // client-side. Best-effort: only used once email matching has already failed.
  const contacts = await findBySearchText(gstin || phone || '')
  for (const contact of contacts) {
    const full = await getFullContact(contact)
    if ((gstin && normalizeText(full.gst_no) === normalizeText(gstin)) || (phone && contactHasPhone(full, phone))) {
      return full
    }
  }
  return undefined
}

async function findBySearchText(searchText: string): Promise<ZohoContact[]> {
  const contacts: ZohoContact[] = []

  for (const filterBy of ['Status.All', 'Status.Active', 'Status.Inactive']) {
    const params = new URLSearchParams({ search_text: searchText, filter_by: filterBy })
    const data = await zohoFetch<{ contacts: ZohoContact[] }>(`/contacts?${params.toString()}`)
    contacts.push(...(data.contacts ?? []))
  }

  const seen = new Set<string>()
  return contacts.filter((contact) => {
    if (seen.has(contact.contact_id)) return false
    seen.add(contact.contact_id)
    return true
  })
}

async function findByDisplayName(displayName: string): Promise<ZohoContact | undefined> {
  const contacts = await findBySearchText(displayName)
  const matched = contacts.find((c) => normalizeText(c.contact_name) === normalizeText(displayName))
  return matched ? getFullContact(matched) : undefined
}

async function findByDisplayNameAndIdentity(args: FindOrCreateZohoCustomerArgs): Promise<ZohoContact | undefined> {
  const displayName = getZohoDisplayName(args)
  const contacts = await findBySearchText(displayName)

  for (const contact of contacts) {
    if (normalizeText(contact.contact_name) !== normalizeText(displayName)) continue

    const full = await getFullContact(contact)
    if (args.gstin && normalizeText(full.gst_no) === normalizeText(args.gstin)) return full
    if (args.email && contactHasEmail(full, args.email)) return full
    if (args.phone && contactHasPhone(full, args.phone)) return full
  }

  return undefined
}

async function findDuplicateContact(args: FindOrCreateZohoCustomerArgs, duplicateName?: string): Promise<ZohoContact | undefined> {
  const candidates: ZohoContact[] = []

  if (duplicateName) {
    const byDisplayName = await findByDisplayName(duplicateName)
    if (byDisplayName) return byDisplayName
  }

  if (args.email) {
    const byEmail = await findByEmail(args.email)
    if (byEmail) return byEmail
  }

  for (const searchText of [duplicateName, extractEmail(duplicateName), args.email, getZohoDisplayName(args)]) {
    if (!searchText) continue
    candidates.push(...(await findBySearchText(searchText)))
  }

  const seen = new Set<string>()
  const unique = candidates.filter((contact) => {
    if (seen.has(contact.contact_id)) return false
    seen.add(contact.contact_id)
    return true
  })

  const normalizedDuplicateName = duplicateName?.trim().toLowerCase()
  const normalizedEmail = args.email?.trim().toLowerCase()

  return unique.find((contact) => {
    const contactName = contact.contact_name?.trim().toLowerCase()
    if (normalizedDuplicateName && contactName === normalizedDuplicateName) return true
    if (
      normalizedEmail &&
      (contactName?.includes(normalizedEmail) ||
        contact.contact_persons?.some((person) => person.email?.trim().toLowerCase() === normalizedEmail))
    ) {
      return true
    }
    return false
  })
}

export async function markZohoContactActive(contactId: string): Promise<void> {
  await zohoFetch<{ message: string }>(`/contacts/${contactId}/active`, { method: 'POST' })
}

async function ensureContactActive(contact: ZohoContact): Promise<ZohoContact> {
  if (contact.status?.toLowerCase() !== 'inactive') return contact
  await markZohoContactActive(contact.contact_id)
  return { ...contact, status: 'active' }
}

async function createContact(args: FindOrCreateZohoCustomerArgs, displayNameOverride?: string): Promise<ZohoContact> {
  const data = await zohoFetch<{ contact: ZohoContact }>('/contacts', {
    method: 'POST',
    body: JSON.stringify(buildContactPayload(args, displayNameOverride)),
  })
  return data.contact
}

async function updateContact(
  contactId: string,
  args: FindOrCreateZohoCustomerArgs,
  displayNameOverride?: string | null,
): Promise<ZohoContact> {
  try {
    const data = await zohoFetch<{ contact: ZohoContact }>(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(buildContactPayload(args, displayNameOverride)),
    })
    return data.contact
  } catch (err) {
    // Zoho enforces a unique contact_name/Display Name org-wide. If this
    // update collides with another contact, keep the existing display name
    // rather than suffixing it with email/phone. Zoho Display Name must stay
    // company name or customer name only.
    if (!isZohoDuplicateContactError(err)) throw err

    const data = await zohoFetch<{ contact: ZohoContact }>(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(buildContactPayload(args, null)),
    })
    return data.contact
  }
}

/**
 * Find-or-create with the priority order the ecommerce integration requires:
 * stored Zoho customer id → email → GSTIN → phone. Never creates a duplicate
 * contact when any of those already resolve to one — updates it in place instead
 * when its GST/company/address/Display Name details have drifted.
 *
 * An email match specifically gets a second check: two orders can share one
 * login email while billing genuinely different identities (a personal
 * address vs. a registered business address with its own GSTIN) — confirmed
 * live, where a shared contact's GSTIN survived onto an order for an address
 * that had none. When the email-matched contact's GST/company conflicts with
 * this order's own details, it's treated as a different identity: matched
 * further only by GSTIN/phone (not reused outright), so the two identities
 * get their own contacts instead of overwriting each other.
 */
export async function findOrCreateZohoCustomer(
  args: FindOrCreateZohoCustomerArgs,
): Promise<FindOrCreateZohoCustomerResult> {
  let existing: ZohoContact | undefined

  if (args.existingContactId) existing = await findByContactId(args.existingContactId)

  let matchedByEmailOnly = false
  if (!existing && args.email) {
    existing = await findByEmail(args.email)
    matchedByEmailOnly = Boolean(existing)
  }

  if (existing && matchedByEmailOnly && identityConflicts(existing, args)) {
    const rematched = await findByGstinOrPhone(args.gstin, args.phone)
    existing = rematched && rematched.contact_id !== existing.contact_id ? rematched : undefined
  } else if (!existing) {
    existing = await findByGstinOrPhone(args.gstin, args.phone)
  }

  if (!existing) {
    existing = await findByDisplayNameAndIdentity(args)
  }

  if (!existing && args.email) {
    const duplicate = await findDuplicateContact(args, `${getZohoDisplayName(args)} (${args.email})`)
    existing = duplicate && !identityConflicts(duplicate, args) ? duplicate : undefined
  }

  if (existing) {
    existing = await ensureContactActive(existing)
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
    // Zoho enforces a unique contact_name/Display Name org-wide (code 3062,
    // "already exists — specify a different name"). Never create a fallback
    // name like "Customer (email)" — display names must remain company name
    // or customer name only. Reuse the matched contact when possible.
    if (!isZohoDuplicateContactError(err)) throw err

    const duplicateName = extractDuplicateCustomerName(err)
    const matched = await findDuplicateContact(args, duplicateName)

    if (matched) {
      const duplicateNameMatches =
        duplicateName &&
        matched.contact_name?.trim().toLowerCase() === duplicateName.trim().toLowerCase()
      const active = await ensureContactActive(matched)
      if (identityConflicts(active, args) && !duplicateNameMatches) throw err

      const updated = !identityConflicts(active, args) && contactNeedsUpdate(active, args)
        ? await updateContact(active.contact_id, args)
        : active
      return { contact: updated, wasCreated: false, wasUpdated: updated !== active }
    }

    throw err
  }
}
