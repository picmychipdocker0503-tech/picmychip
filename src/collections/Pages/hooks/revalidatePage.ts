import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '../../../payload-types'

// revalidatePath requires an active Next.js request-scoped context to run —
// it throws "Invariant: static generation store missing" outside one, and
// since afterChange hooks run inside the same DB transaction as the write,
// that throw rolls back the entire update (confirmed live with the same
// pattern on Products: a bulk edit's category change silently never
// persisted). Revalidation is a cache-freshness nicety, never something
// allowed to undo a real write.
function safeRevalidatePath(path: string, logger: { warn: (obj: unknown) => void }): void {
  try {
    revalidatePath(path)
  } catch (err) {
    logger.warn({ msg: 'revalidatePath failed (non-fatal)', path, err })
  }
}

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = doc.slug === 'home' ? '/' : `/${doc.slug}`

      payload.logger.info(`Revalidating page at path: ${path}`)

      safeRevalidatePath(path, payload.logger)
      //revalidateTag('pages-sitemap', 'max')
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`

      payload.logger.info(`Revalidating old page at path: ${oldPath}`)

      safeRevalidatePath(oldPath, payload.logger)
      //revalidateTag('pages-sitemap', 'max')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`
    safeRevalidatePath(path, payload.logger)
    //revalidateTag('pages-sitemap', 'max')
  }

  return doc
}
