import { Meilisearch } from 'meilisearch'

export const PRODUCTS_INDEX = 'products'

let client: Meilisearch | undefined

/**
 * Search/facets are optional at runtime — every caller of this client must
 * be prepared for it to be unreachable (MEILI_HOST unset, service down,
 * etc.) and fall back to a direct database query rather than surface an
 * error to the storefront.
 */
export const getMeiliClient = (): Meilisearch => {
  if (!client) {
    client = new Meilisearch({
      host: process.env.MEILI_HOST || 'http://127.0.0.1:7700',
      apiKey: process.env.MEILI_MASTER_KEY,
    })
  }

  return client
}
