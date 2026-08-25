import type { CollectionAfterChangeHook } from 'payload'

import type { Product } from '@/payload-types'
import { getMeiliClient, PRODUCTS_INDEX } from '@/lib/meilisearch'
import { toSearchDocument } from '@/lib/searchIndex'
import { invalidateSearchCandidatePool } from '@/lib/searchProducts'

/**
 * Search is a read-optimized copy of published products, not a system of
 * record — a Meilisearch outage must never block saving a product, so every
 * failure here is caught and logged, never rethrown.
 */
export const syncProductToSearchIndex: CollectionAfterChangeHook<Product> = async ({ doc, req }) => {
  // Whenever Meilisearch is down, category/shop listings fall back to an
  // in-memory candidate pool cached for up to 60s (searchProducts.ts) —
  // without dropping it here too, a publish/unpublish wouldn't show up in
  // those listings until that cache happened to expire on its own.
  invalidateSearchCandidatePool()

  try {
    const index = getMeiliClient().index(PRODUCTS_INDEX)

    if (doc._status === 'published') {
      await index.addDocuments([toSearchDocument(doc)])
    } else {
      await index.deleteDocument(String(doc.id))
    }
  } catch (error) {
    req.payload.logger.warn(`Failed to sync product ${doc.id} to search index: ${error}`)
  }

  return doc
}
