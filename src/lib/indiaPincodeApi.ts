/**
 * Client for the free, public India Pincode API (static JSON built from
 * India Post's open data, hosted on GitHub Pages: aniket-thapa.github.io/
 * india-pincode-api). Used to drive the checkout address form's cascading
 * State → District → City → Pincode selects — there's no official
 * government API for this forward direction (India Post's own API only
 * looks up pincode → district/state, not the reverse).
 */
const BASE_URL = 'https://aniket-thapa.github.io/india-pincode-api'

export type PincodeApiState = {
  name: string
  slug: string
  districtCount: number
  officeCount: number
}

export type PincodeApiDistrict = {
  name: string
  slug: string
  officeCount: number
}

export type PincodeApiOffice = {
  officeName: string
  officeType: string
  deliveryStatus: string
  pincode: string
}

let cachedStates: PincodeApiState[] | null = null

export async function fetchStates(): Promise<PincodeApiState[]> {
  if (cachedStates) return cachedStates
  const res = await fetch(`${BASE_URL}/states.json`)
  if (!res.ok) throw new Error('Could not load state list.')
  cachedStates = (await res.json()) as PincodeApiState[]
  return cachedStates
}

export async function fetchDistricts(stateSlug: string): Promise<PincodeApiDistrict[]> {
  const res = await fetch(`${BASE_URL}/states/${stateSlug}.json`)
  if (!res.ok) throw new Error('Could not load district list.')
  const data = (await res.json()) as { districts: PincodeApiDistrict[] }
  return data.districts || []
}

export async function fetchOffices(stateSlug: string, districtSlug: string): Promise<PincodeApiOffice[]> {
  const res = await fetch(`${BASE_URL}/districts/${stateSlug}/${districtSlug}.json`)
  if (!res.ok) throw new Error('Could not load city/pincode list.')
  const data = (await res.json()) as { offices: PincodeApiOffice[] }
  return data.offices || []
}

const toSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    // This API names one UT "THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU"
    // (leading "the"), unlike the GST state-code list's "Dadra and Nagar
    // Haveli and Daman and Diu" (src/lib/indianStates.ts) — stripped here so
    // the two lists' slugs still line up instead of silently mismatching.
    .replace(/^the-/, '')

/**
 * Finds this API's state slug for a given state name — names are matched
 * loosely (case/punctuation-insensitive slug comparison) since this API's
 * naming doesn't always exactly match the GST state-code list used
 * elsewhere in the app (src/lib/indianStates.ts).
 */
export async function findStateSlug(stateName: string): Promise<string | undefined> {
  const states = await fetchStates()
  const target = toSlug(stateName)
  return states.find((s) => s.slug === target || toSlug(s.name) === target)?.slug
}
