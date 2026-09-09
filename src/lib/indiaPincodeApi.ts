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

// The district reverse-lookup (matching a pincode against every district in
// a state) fires dozens of these in parallel — a single transient failure
// (a flaky DNS resolution to this GitHub Pages host, in particular) used to
// silently read as "this district has no matching office", making the whole
// search falsely report "not found" even though the real data was there.
// A couple of quick retries absorb exactly that kind of one-off blip without
// meaningfully slowing down a request that actually is failing for real.
async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      lastError = new Error(`Request failed with status ${res.status}`)
    } catch (err) {
      lastError = err
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 200 * attempt))
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed')
}

export async function fetchStates(): Promise<PincodeApiState[]> {
  if (cachedStates) return cachedStates
  const res = await fetchWithRetry(`${BASE_URL}/states.json`)
  cachedStates = (await res.json()) as PincodeApiState[]
  return cachedStates
}

export async function fetchDistricts(stateSlug: string): Promise<PincodeApiDistrict[]> {
  const res = await fetchWithRetry(`${BASE_URL}/states/${stateSlug}.json`)
  const data = (await res.json()) as { districts: PincodeApiDistrict[] }
  return data.districts || []
}

export async function fetchOffices(stateSlug: string, districtSlug: string): Promise<PincodeApiOffice[]> {
  const res = await fetchWithRetry(`${BASE_URL}/districts/${stateSlug}/${districtSlug}.json`)
  const data = (await res.json()) as { offices: PincodeApiOffice[] }
  return data.offices || []
}

export type PincodeLookupResult = {
  state: string
  district: string
  offices: PincodeApiOffice[]
}

/**
 * Direct pincode -> state/district/offices lookup — this dataset hosts a
 * flat file per pincode alongside its per-district ones, so resolving a
 * known pincode costs one request instead of fetching every district's full
 * office list in a state to find which one contains it (what the district
 * reverse-lookup used to do — ~38 parallel requests for Tamil Nadu alone).
 * `district` here comes from the same dataset as fetchDistricts, so it's
 * safe to match directly against a district list's name/slug — unlike
 * India Post's own official API (used by the forward pincode lookup below),
 * which spells some districts differently (e.g. "Tiruvallur" vs this
 * dataset's "Thiruvallur") and would silently fail to match.
 */
export async function fetchByPincode(pincode: string): Promise<PincodeLookupResult | undefined> {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/pincodes/${pincode}.json`)
    const data = (await res.json()) as {
      state: string
      district: string
      offices: Omit<PincodeApiOffice, 'pincode'>[]
    }
    if (!data.district) return undefined
    return {
      state: data.state,
      district: data.district,
      offices: (data.offices || []).map((office) => ({ ...office, pincode })),
    }
  } catch {
    return undefined
  }
}

export const toSlug = (name: string) =>
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
