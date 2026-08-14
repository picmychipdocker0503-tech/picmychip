export const zohoIsConfigured = Boolean(
  process.env.ZOHO_CLIENT_ID &&
    process.env.ZOHO_CLIENT_SECRET &&
    process.env.ZOHO_REFRESH_TOKEN &&
    process.env.ZOHO_ORGANIZATION_ID,
)

// Read live rather than cached into module-level constants (same convention as
// src/lib/shiprocket.ts, which reads process.env.SHIPROCKET_* inline per call) —
// a module-level `const X = process.env.X` would freeze in whatever value was
// set at first import, which is wrong the moment env vars are reloaded/changed
// without a process restart (and made a real test bug obvious: caching
// ZOHO_ORGANIZATION_ID meant it was always the empty string in tests that set
// the env var in a beforeEach, since that runs after this module's first import).
export const getZohoApiDomain = (): string => process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in'
const getZohoAccountsDomain = (): string => process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.in'
export const getZohoOrganizationId = (): string => process.env.ZOHO_ORGANIZATION_ID || ''

// Zoho access tokens are valid ~1 hour. Caching in module scope (same pattern as
// src/lib/shiprocket.ts's cachedToken) avoids a refresh round-trip on every request.
let cachedToken: { expiresAt: number; token: string } | null = null

export async function getZohoAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token

  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN || '',
    client_id: process.env.ZOHO_CLIENT_ID || '',
    client_secret: process.env.ZOHO_CLIENT_SECRET || '',
    grant_type: 'refresh_token',
  })

  const res = await fetch(`${getZohoAccountsDomain()}/oauth/v2/token?${params.toString()}`, {
    method: 'POST',
  })

  const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: string }

  if (!res.ok || !data.access_token) {
    throw new Error(`Zoho OAuth token refresh failed: ${res.status} ${data.error || JSON.stringify(data)}`)
  }

  // Refresh a minute early to avoid a request straddling the expiry boundary.
  const ttlMs = ((data.expires_in ?? 3600) - 60) * 1000
  cachedToken = { token: data.access_token, expiresAt: Date.now() + ttlMs }
  return data.access_token
}

/**
 * Issues an authenticated request against the Zoho Books API — attaches the
 * OAuth header + organization id (merged into whatever query string `path`
 * already has; Zoho Books, unlike Zoho Invoice, takes it as an
 * `organization_id` query parameter rather than a header) and returns the
 * raw Response. Shared by zohoFetch (JSON) and zohoFetchBinary (PDF bytes).
 */
async function zohoRequest(path: string, init?: RequestInit): Promise<Response> {
  const token = await getZohoAccessToken()

  const [pathname, existingQuery] = path.split('?')
  const query = new URLSearchParams(existingQuery)
  query.set('organization_id', getZohoOrganizationId())

  return fetch(`${getZohoApiDomain()}/books/v3${pathname}?${query.toString()}`, {
    ...init,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      ...init?.headers,
    },
  })
}

/**
 * For JSON endpoints. Responses are always JSON with a `code`/`message`
 * envelope, even on failure.
 */
export async function zohoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await zohoRequest(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  const data = await res.json()

  if (!res.ok || (typeof data?.code === 'number' && data.code !== 0)) {
    throw new Error(`Zoho Books API error (${path}): ${res.status} ${JSON.stringify(data)}`)
  }

  return data as T
}

/**
 * For binary endpoints (PDF export). Zoho still returns a JSON error
 * envelope on failure despite the endpoint normally producing a PDF, so a
 * non-PDF content-type on a 200 is treated as an error too.
 */
export async function zohoFetchBinary(path: string): Promise<Buffer> {
  const res = await zohoRequest(path)

  const contentType = res.headers.get('content-type') || ''
  if (!res.ok || !contentType.includes('pdf')) {
    const body = await res.text()
    throw new Error(`Zoho Books API error (${path}): ${res.status} ${body}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
