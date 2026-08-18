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
export const getMeiliClient = (): Meilisearch => {
  const host = getMeiliHost()

  if (!client || clientHost !== host) {
    client = new Meilisearch({
      host,
      apiKey: process.env.MEILI_MASTER_KEY,
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
