import { Meilisearch } from 'meilisearch'

export const PRODUCTS_INDEX = 'products'

let client: Meilisearch | undefined
let clientHost: string | undefined

const isLocalhostMeiliHost = (host: string): boolean => {
  try {
    const hostname = new URL(host).hostname
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1'
  } catch {
    return false
  }
}

export const getMeiliHost = (): string => {
  const host = process.env.MEILI_HOST?.trim()

  if (!host) {
    throw new Error('MEILI_HOST is not configured')
  }

  if (process.env.NODE_ENV === 'production' && isLocalhostMeiliHost(host)) {
    throw new Error('MEILI_HOST points to localhost in production')
  }

  return host
}

/**
 * Search/facets are optional at runtime. Every caller of this client must be
 * prepared for it to be unreachable or unconfigured and fall back to a direct
 * database query rather than surface an error to the storefront.
 */
// A degraded (not fully down) Meilisearch host with no request timeout would
// otherwise hang every storefront search/listing request — and every
// product save's index-sync hook — for however long the SDK's underlying
// fetch takes to give up, which can be much longer than a page load should
// ever take. Bounding it means a slow Meilisearch fails the same fast way a
// fully-down one already does, so callers fall back to the database quickly.
const REQUEST_TIMEOUT_MS = 2_000

export const getMeiliClient = (): Meilisearch => {
  const host = getMeiliHost()

  if (!client || clientHost !== host) {
    client = new Meilisearch({
      host,
      apiKey: process.env.MEILI_MASTER_KEY,
      timeout: REQUEST_TIMEOUT_MS,
    })
    clientHost = host
  }

  return client
}

export const shouldUseMeilisearch = (): boolean => {
  const host = process.env.MEILI_HOST?.trim()
  return Boolean(host && !(process.env.NODE_ENV === 'production' && isLocalhostMeiliHost(host)))
}

export const verifyMeiliConnection = async (): Promise<{ host: string; healthStatus: string }> => {
  const host = getMeiliHost()
  const health = await getMeiliClient().health()

  return {
    host,
    healthStatus: health.status,
  }
}
