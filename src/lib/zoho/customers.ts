import { zohoFetch } from './auth'
import type { ZohoAddress, ZohoContact } from './types'

export type FindOrCreateZohoCustomerArgs = {
  /** Zoho customer id already stored against this ecommerce customer, if any — checked first. */
  existingContactId?: string
  /**
   * The local PICMYCHIP Customer/User id, when this order was placed by a
   * logged-in account. Used two ways: (1) as a guaranteed-unique Display
   * Name suffix on collision-retry create, since it's our own primary key
   * rather than something Zoho could ever also assign to someone else; (2)
   * as a signal that identity is already pinned to this account, so an
   * email-matched Zoho contact is reused as-is even if its GSTIN differs
   * from this particular order's — the account, not the order's billing
   * details, is the source of truth once one is known.
   */
  localCustomerId?: string | number
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
// Title-cases every word — checkout doesn't enforce casing on name/company
// input, so "keerthan kumar p" or "SRI SAKTHI INDUSTRIES" would otherwise
// show up as typed on the Zoho Sales Order and Invoice PDFs instead of as
// "Keerthan Kumar P" / "Sri Sakthi Industries".
const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')

export function getZohoDisplayName(args: { companyName?: string | null; contactName: string }): string {
  const company = (args.companyName || '').trim()
  if (company) return toTitleCase(company)
  return toTitleCase((args.contactName || '').trim())
}

// Contacts follow the storefront billing identity: GSTIN means a registered
// business; no GSTIN means Zoho's unregistered-business treatment. The display
// name remains company-first, falling back to the customer's own name.
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
    gst_treatment: args.gstin ? 'business_gst' : 'business_none',
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
  const digits = (value || '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

function contactEmails(contact: ZohoContact): string[] {
  const rootEmail = (contact as ZohoContact & { email?: string }).email
  return [rootEmail, ...(contact.contact_persons?.map((person) => person.email) ?? [])]
    .map(normalizeText)
    .filter(Boolean)
}

function contactPhones(contact: ZohoContact): string[] {
  const root = contact as ZohoContact & { phone?: string; mobile?: string }
  return [
    root.phone,
    root.mobile,
    contact.billing_address?.phone,
    contact.shipping_address?.phone,
    ...(contact.contact_persons?.flatMap((person) => {
      const typedPerson = person as typeof person & { mobile?: string }
      return [typedPerson.phone, typedPerson.mobile]
    }) ?? []),
  ]
    .map(normalizePhone)
    .filter(Boolean)
}

function contactNameMatches(contact: ZohoContact, args: FindOrCreateZohoCustomerArgs, duplicateName?: string): boolean {
  const names = [duplicateName, getZohoDisplayName(args), args.contactName].map(normalizeText).filter(Boolean)
  return names.includes(normalizeText(contact.contact_name))
}

function contactEmailMatches(contact: ZohoContact, email?: string): boolean {
  const normalizedEmail = normalizeText(email)
  return Boolean(normalizedEmail && contactEmails(contact).includes(normalizedEmail))
}

function contactPhoneMatches(contact: ZohoContact, phone?: string): boolean {
  const normalizedPhone = normalizePhone(phone)
  return Boolean(normalizedPhone && contactPhones(contact).includes(normalizedPhone))
}

/**
 * Preferred suffix is the local customer id — deterministic, human-readable,
 * and unique by construction since it's our own primary key. Falls back to
 * email/phone only for orders with no account behind them (guest checkout).
 */
function getUniqueDisplayName(args: FindOrCreateZohoCustomerArgs): string | undefined {
  const base = getZohoDisplayName(args)
  if (args.localCustomerId !== undefined && args.localCustomerId !== null) {
    return `${base} (Cust #${args.localCustomerId})`
  }
  if (args.email) return `${base} (${args.email.trim().toLowerCase()})`
  const phone = normalizePhone(args.phone)
  return phone ? `${base} (${phone})` : undefined
}

async function findByContactId(contactId: string): Promise<ZohoContact | undefined> {
  try {
    const data = await zohoFetch<{ contact: ZohoContact }>(`/contacts/${contactId}`)
    return data.contact
  } catch {
    return undefined
  }
}

/**
 * Zoho's `/contacts` list endpoint does not reliably filter by its own
 * `email` query param — confirmed live, it can return the org's entire
 * contact list (sorted by contact_name) regardless of the email queried.
 * Blindly trusting contacts[0] here is exactly how two real accounts ended
 * up sharing "ABC Electronics" (alphabetically first) as their Zoho contact.
 * Same client-side verification findByGstinOrPhone already does for
 * GSTIN/phone, applied to email too — never trust the API's filtering.
 *
 * `preferNoCompany` handles a second, separate problem: pre-existing
 * duplicate contacts genuinely sharing one email (real data contamination
 * from before this dedup fix existed, not something this fetch causes) —
 * confirmed live, an individual customer's account got pinned to a
 * company-named duplicate ("ABC Electronics") that happened to sort first,
 * even though the order itself carried no company name. When the current
 * order has no company name, a matching contact that also has none is
 * preferred over one that does, since the latter represents a distinct
 * registered-business identity, not this order's plain individual one.
 */
async function findByEmail(email: string, preferNoCompany: boolean): Promise<ZohoContact | undefined> {
  const params = new URLSearchParams({ email, filter_by: 'Status.All' })
  const data = await zohoFetch<{ contacts: ZohoContact[] }>(`/contacts?${params.toString()}`)
  const matches = (data.contacts ?? []).filter((c) => contactEmailMatches(c, email))
  if (matches.length <= 1) return matches[0]
  if (preferNoCompany) {
    const withoutCompany = matches.find((c) => !c.company_name)
    if (withoutCompany) return withoutCompany
  }
  return matches[0]
}

async function findByGstinOrPhone(gstin?: string, phone?: string): Promise<ZohoContact | undefined> {
  if (!gstin && !phone) return undefined
  // Zoho's contacts list endpoint has no dedicated gst_no/phone filter — falls back
  // to the general-purpose search_text param and filters the (small) result set
  // client-side. Best-effort: only used once email matching has already failed.
  const searchText = gstin || phone || ''
  const params = new URLSearchParams({ search_text: searchText, filter_by: 'Status.All' })
  const data = await zohoFetch<{ contacts: ZohoContact[] }>(`/contacts?${params.toString()}`)
  return data.contacts?.find((c) => (gstin && c.gst_no === gstin) || contactPhoneMatches(c, phone))
}

async function findBySearchText(searchText: string): Promise<ZohoContact[]> {
  const params = new URLSearchParams({ search_text: searchText, filter_by: 'Status.All' })
  const data = await zohoFetch<{ contacts: ZohoContact[] }>(`/contacts?${params.toString()}`)
  return data.contacts ?? []
}

async function findByDisplayName(displayName: string): Promise<ZohoContact | undefined> {
  const contacts = await findBySearchText(displayName)
  return contacts.find((c) => c.contact_name?.trim().toLowerCase() === displayName.trim().toLowerCase())
}

async function findDuplicateContact(args: FindOrCreateZohoCustomerArgs, duplicateName?: string): Promise<ZohoContact | undefined> {
  const candidates: ZohoContact[] = []

  if (args.email) {
    const byEmail = await findByEmail(args.email, !args.companyName)
    if (byEmail) return byEmail
  }

  const uniqueDisplayName = getUniqueDisplayName(args)
  for (const searchText of [
    duplicateName,
    extractEmail(duplicateName),
    args.phone,
    args.email,
    uniqueDisplayName,
    getZohoDisplayName(args),
    args.contactName,
  ]) {
    if (!searchText) continue
    candidates.push(...(await findBySearchText(searchText)))
  }

  const seen = new Set<string>()
  const unique = candidates.filter((contact) => {
    if (seen.has(contact.contact_id)) return false
    seen.add(contact.contact_id)
    return true
  })

  return (
    unique.find((contact) => contactNameMatches(contact, args, duplicateName) && contactPhoneMatches(contact, args.phone)) ||
    unique.find((contact) => contactEmailMatches(contact, args.email)) ||
    unique.find((contact) => contact.contact_name && normalizeText(contact.contact_name) === normalizeText(uniqueDisplayName))
  )
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
 * When `localCustomerId` is supplied (order placed by a logged-in account),
 * an email match is trusted as-is: the account is the identity, full stop —
 * every order from the same account resolves to the same contact, and a
 * differing GSTIN across orders is treated as that account's GST details
 * changing, not a different customer. Without `localCustomerId` (guest
 * checkout, no account to pin identity to), an email match specifically gets
 * a second check: two guest orders can share one email while billing
 * genuinely different identities (a personal address vs. a registered
 * business address with its own GSTIN) — confirmed live, where a shared
 * contact's GSTIN survived onto an order for an address that had none. When
 * the email-matched contact's GST/company conflicts with this order's own
 * details, it's treated as a different identity: matched further only by
 * GSTIN/phone (not reused outright), so the two identities get their own
 * contacts instead of overwriting each other.
 */
export async function findOrCreateZohoCustomer(
  args: FindOrCreateZohoCustomerArgs,
): Promise<FindOrCreateZohoCustomerResult> {
  let existing: ZohoContact | undefined

  if (args.existingContactId) existing = await findByContactId(args.existingContactId)

  // Once we know which local account placed this order, that account IS the
  // identity — an email match is trusted outright even if this order's GSTIN
  // differs from what's on file (the account's GST details simply changed;
  // contactNeedsUpdate below syncs it). Without a known account (guest
  // checkout), a GSTIN mismatch on an email match still means "different
  // real customer sharing a login" and is treated as a non-match.
  const identityPinnedToAccount = args.localCustomerId !== undefined && args.localCustomerId !== null

  let matchedByEmailOnly = false
  if (!existing && args.email) {
    existing = await findByEmail(args.email, !args.companyName)
    matchedByEmailOnly = Boolean(existing)
  }

  if (existing && matchedByEmailOnly && !identityPinnedToAccount && identityConflicts(existing, args)) {
    const rematched = await findByGstinOrPhone(args.gstin, args.phone)
    existing = rematched && rematched.contact_id !== existing.contact_id ? rematched : undefined
  } else if (!existing) {
    existing = await findByGstinOrPhone(args.gstin, args.phone)
  }

  if (!existing && args.email) {
    const duplicate = await findDuplicateContact(args, `${getZohoDisplayName(args)} (${args.email})`)
    existing = duplicate && (identityPinnedToAccount || !identityConflicts(duplicate, args)) ? duplicate : undefined
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
    // Zoho enforces a unique contact_name/Display Name org-wide (code 3062).
    // Reuse/update an existing contact when phone+name or email matches; if
    // only the display name collides, create a deterministic email/phone-suffixed
    // display name so a genuinely different customer can still be created.
    if (!isZohoDuplicateContactError(err)) throw err

    const duplicateName = extractDuplicateCustomerName(err)
    const matched = await findDuplicateContact(args, duplicateName)

    if (matched && (identityPinnedToAccount || !identityConflicts(matched, args))) {
      const active = await ensureContactActive(matched)
      const updated = contactNeedsUpdate(active, args)
        ? await updateContact(active.contact_id, args)
        : active
      return { contact: updated, wasCreated: false, wasUpdated: updated !== active }
    }

    const uniqueDisplayName = getUniqueDisplayName(args)
    if (uniqueDisplayName) {
      const created = await createContact(args, uniqueDisplayName)
      return { contact: created, wasCreated: true, wasUpdated: false }
    }

    throw err
  }
}
