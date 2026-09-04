// Separate from src/lib/zoho/auth.ts (which is scoped to Zoho Books/Invoice
// OAuth) — Zoho Payments needs its own self-client with
// ZohoPay.payments.CREATE / ZohoPay.payments.READ scopes, its own token, and
// a different base API domain, so reusing that module's cache/env vars would
// silently break if the scopes ever diverge.

export const zohoPaymentsIsConfigured = Boolean(
  process.env.ZOHO_PAYMENTS_CLIENT_ID &&
    process.env.ZOHO_PAYMENTS_CLIENT_SECRET &&
    process.env.ZOHO_PAYMENTS_REFRESH_TOKEN &&
    process.env.ZOHO_PAYMENTS_ACCOUNT_ID,
)

// Read live rather than caching into a module-level const — see the same
// note in src/lib/zoho/auth.ts.
export const getZohoPaymentsApiDomain = (): string =>
  process.env.ZOHO_PAYMENTS_API_DOMAIN || 'https://payments.zoho.in'
const getZohoPaymentsAccountsDomain = (): string =>
  process.env.ZOHO_PAYMENTS_ACCOUNTS_DOMAIN || 'https://accounts.zoho.in'
export const getZohoPaymentsAccountId = (): string => process.env.ZOHO_PAYMENTS_ACCOUNT_ID || ''

let cachedToken: { expiresAt: number; token: string } | null = null

export async function getZohoPaymentsAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token

  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_PAYMENTS_REFRESH_TOKEN || '',
    client_id: process.env.ZOHO_PAYMENTS_CLIENT_ID || '',
    client_secret: process.env.ZOHO_PAYMENTS_CLIENT_SECRET || '',
    grant_type: 'refresh_token',
  })

  const res = await fetch(`${getZohoPaymentsAccountsDomain()}/oauth/v2/token?${params.toString()}`, {
    method: 'POST',
  })

  const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: string }

  if (!res.ok || !data.access_token) {
    throw new Error(`Zoho Payments OAuth token refresh failed: ${res.status} ${data.error || JSON.stringify(data)}`)
  }

  const ttlMs = ((data.expires_in ?? 3600) - 60) * 1000
  cachedToken = { token: data.access_token, expiresAt: Date.now() + ttlMs }
  return data.access_token
}

/**
 * Issues an authenticated request against the Zoho Payments API — attaches
 * the OAuth header and the required `account_id` query param, JSON in/out.
 * Zoho Payments always returns a `code`/`message` envelope, even on failure.
 */
export async function zohoPaymentsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getZohoPaymentsAccessToken()

  const [pathname, existingQuery] = path.split('?')
  const query = new URLSearchParams(existingQuery)
  query.set('account_id', getZohoPaymentsAccountId())

  const res = await fetch(`${getZohoPaymentsApiDomain()}${pathname}?${query.toString()}`, {
    ...init,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const data = await res.json()

  if (!res.ok || (typeof data?.code === 'number' && data.code !== 0)) {
    throw new Error(`Zoho Payments API error (${path}): ${res.status} ${JSON.stringify(data)}`)
  }

  return data as T
}
