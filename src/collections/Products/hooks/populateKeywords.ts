import type { CollectionBeforeValidateHook } from 'payload'
import type { Product } from '@/payload-types'

import { extractKeywordsFromTitle } from '@/utilities/extractKeywordsFromTitle'

/**
 * Auto-syncs Product.keywords from Product.title — skipped entirely when an
 * admin has opted out via overrideKeywords, and only re-derived on update
 * when the title actually changed (so a manual edit an admin made without
 * checking overrideKeywords isn't clobbered on every unrelated save).
 */
export const populateKeywords: CollectionBeforeValidateHook<Product> = ({ data, operation, originalDoc }) => {
  if (!data || data.overrideKeywords) return data

  const titleChanged = operation === 'create' || data.title !== originalDoc?.title
  if (!titleChanged) return data

  try {
    if (!data.title) return data
    return { ...data, keywords: extractKeywordsFromTitle(data.title) }
  } catch (error) {
    console.error('[populateKeywords]', error)
    // Falls back to whatever keywords already exist rather than wiping the field.
    return { ...data, keywords: data.keywords ?? originalDoc?.keywords }
  }
}
