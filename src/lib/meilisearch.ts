import { Meilisearch } from 'meilisearch'

export const PRODUCTS_INDEX = 'products'

let client: Meilisearch | undefined
let clientHost: string | undefined

export const getMeiliHost = (): string => {
  const host = process.env.MEILI_HOST?.trim()

  if (!host) {
    throw new Error('MEILI_HOST is not configured')
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

export const verifyMeiliConnection = async (): Promise<{ host: string; healthStatus: string }> => {
  const host = getMeiliHost()
  const health = await getMeiliClient().health()

  return {
    host,
    healthStatus: health.status,
  }
}
