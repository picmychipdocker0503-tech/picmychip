import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Product } from '@/payload-types'

/**
 * Mirrors Pages' revalidatePage hook — the product detail page is static
 * (see generateStaticParams on /products/[slug]/page.tsx), so without this,
 * edits made in the admin panel (or a stock push from /api/inventory-webhook,
 * which updates products through this same Local API path) wouldn't show up
 * on the live page until the next full rebuild.
 */
export const revalidateProduct: CollectionAfterChangeHook<Product> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published' && doc.slug) {
      const path = `/products/${doc.slug}`
      payload.logger.info(`Revalidating product at path: ${path}`)
      revalidatePath(path)
    }

    // Was published, no longer is (unpublished, or slug changed) — the old
    // path would otherwise keep serving the stale cached page indefinitely.
    if (previousDoc?._status === 'published' && previousDoc.slug && previousDoc.slug !== doc.slug) {
      revalidatePath(`/products/${previousDoc.slug}`)
    }
  }

  return doc
}

export const revalidateProductDelete: CollectionAfterDeleteHook<Product> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate && doc?.slug) {
    revalidatePath(`/products/${doc.slug}`)
  }

  return doc
}
