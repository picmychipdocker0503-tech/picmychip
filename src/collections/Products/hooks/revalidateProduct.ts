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
// revalidatePath requires an active Next.js request-scoped context
// (AsyncLocalStorage's "static generation store") to run — it throws
// "Invariant: static generation store missing" outside one. Confirmed live:
// a Payload admin bulk-edit across several products hit exactly this, and
// because afterChange hooks run inside the same DB transaction as the write,
// the throw rolled back the entire update — the categories change silently
// never happened, with no useful error shown in the admin UI. Revalidation
// is a cache-freshness nicety, never something allowed to undo a real write.
function safeRevalidatePath(path: string, logger: { warn: (obj: unknown) => void }): void {
  try {
    revalidatePath(path)
  } catch (err) {
    logger.warn({ msg: 'revalidatePath failed (non-fatal)', path, err })
  }
}

export const revalidateProduct: CollectionAfterChangeHook<Product> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published' && doc.slug) {
      const path = `/products/${doc.slug}`
      payload.logger.info(`Revalidating product at path: ${path}`)
      safeRevalidatePath(path, payload.logger)
    }

    // Was published, no longer is (unpublished, or slug changed) — the old
    // path would otherwise keep serving the stale cached page indefinitely.
    if (previousDoc?._status === 'published' && previousDoc.slug && previousDoc.slug !== doc.slug) {
      safeRevalidatePath(`/products/${previousDoc.slug}`, payload.logger)
    }
  }

  return doc
}

export const revalidateProductDelete: CollectionAfterDeleteHook<Product> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && doc?.slug) {
    safeRevalidatePath(`/products/${doc.slug}`, payload.logger)
  }

  return doc
}
