import type { CollectionAfterChangeHook } from 'payload'

import type { Product } from '@/payload-types'
import { getMeiliClient, PRODUCTS_INDEX } from '@/lib/meilisearch'
import { toSearchDocument } from '@/lib/searchIndex'

/**
 * Search is a read-optimized copy of published products, not a system of
 * record — a Meilisearch outage must never block saving a product, so every
 * failure here is caught and logged, never rethrown.
 */
export const syncProductToSearchIndex: CollectionAfterChangeHook<Product> = async ({ doc, req }) => {
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
