import type { CollectionAfterDeleteHook } from 'payload'

import { getMeiliClient, PRODUCTS_INDEX } from '@/lib/meilisearch'

export const removeProductFromSearchIndex: CollectionAfterDeleteHook = async ({ id, req }) => {
  try {
    await getMeiliClient().index(PRODUCTS_INDEX).deleteDocument(String(id))
  } catch (error) {
    req.payload.logger.warn(`Failed to remove product ${id} from search index: ${error}`)
  }
}
