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

// Some Zoho orgs reject `gst_treatment`/`gst_no`/`place_of_contact` outright
// ("Invalid Element gst_treatment", code 8) when GST/India compliance isn't
// enabled on that org — confirmed against a live org during testing. Only
// sending these when there's an actual GSTIN to report keeps contact
// creation working on orgs with and without GST enabled, rather than always
// asserting a treatment (e.g. "consumer") that not every org accepts.
//
// `displayNameOverride` lets a caller force a specific contact_name (the
// code-3062 disambiguation retries below) or omit the field entirely by
// passing `null` (used only when disambiguation has no email/phone to work
// with, so the name genuinely can't change safely) — otherwise it's
// recomputed from company/contact name via getZohoDisplayName every time,
// per-spec: never trust a stale existing Display Name, always recalculate.
const buildContactPayload = (args: FindOrCreateZohoCustomerArgs, displayNameOverride?: string | null) => {
  const contactName = displayNameOverride === null ? undefined : (displayNameOverride ?? getZohoDisplayName(args))

  return {
    ...(contactName ? { contact_name: contactName } : {}),
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
const contactNeedsUpdate = (existing: ZohoContact, args: FindOrCreateZohoCustomerArgs): boolean => {
  const displayName = getZohoDisplayName(args)
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

async function createContact(args: FindOrCreateZohoCustomerArgs, displayNameOverride?: string): Promise<ZohoContact> {
  const data = await zohoFetch<{ contact: ZohoContact }>('/contacts', {
    method: 'POST',
    body: JSON.stringify(buildContactPayload(args, displayNameOverride)),
  })
  return data.contact
}

async function updateContact(contactId: string, args: FindOrCreateZohoCustomerArgs): Promise<ZohoContact> {
  try {
    const data = await zohoFetch<{ contact: ZohoContact }>(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(buildContactPayload(args)),
    })
    return data.contact
  } catch (err) {
    // A genuine name collision with a *different* contact (Zoho enforces a
    // unique contact_name/Display Name org-wide) — every other failure
    // (network, validation, etc.) still surfaces normally rather than being
    // silently swallowed. This means two different Zoho contacts (different
    // email/GSTIN/phone — that's *why* they're different contacts) both
    // resolve to the same Display Name, e.g. two orders from the same
    // person using different emails. Rather than silently keep whatever
    // name this contact happened to have first (which can end up showing a
    // completely unrelated customer's name/company on this order's
    // documents), disambiguate with the email/phone that's already what's
    // keeping them as separate contacts in the first place.
    const message = err instanceof Error ? err.message : String(err)
    if (!message.includes('"code":3062')) throw err

    const disambiguator = args.email || args.phone
    const displayNameOverride = disambiguator ? `${getZohoDisplayName(args)} (${disambiguator})` : null

    const data = await zohoFetch<{ contact: ZohoContact }>(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(buildContactPayload(args, displayNameOverride)),
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
    // Zoho enforces a unique contact_name/Display Name org-wide (code 3062,
    // "already exists — specify a different name"). Reaching this point
    // already means email/GSTIN/phone matching found nothing, so this is a
    // genuinely different customer whose Display Name merely collides with
    // someone else on file — adopting that other contact would incorrectly
    // merge two different people's orders/addresses under one Zoho
    // customer. Disambiguated instead, with whichever of email/phone this
    // contact actually has (same reasoning as the identical fallback in
    // updateContact above).
    const message = err instanceof Error ? err.message : String(err)
    if (!message.includes('"code":3062')) throw err

    const disambiguator = args.email || args.phone
    if (!disambiguator) throw err

    const created = await createContact(args, `${getZohoDisplayName(args)} (${disambiguator})`)
    return { contact: created, wasCreated: true, wasUpdated: false }
  }
}
