import type { Metadata } from 'next'

import type { Category, Guide, Page, Product } from '../payload-types'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

export const generateMeta = async (args: {
  doc: Page | Product | Category | Guide | null
  path?: string
}): Promise<Metadata> => {
  const { doc, path } = args || {}

  const canonicalPath = path ?? (Array.isArray(doc?.slug) ? `/${doc.slug.join('/')}` : `/${doc?.slug ?? ''}`)

  const ogImage =
    typeof doc?.meta?.image === 'object' &&
    doc.meta.image !== null &&
    'url' in doc.meta.image &&
    `${process.env.NEXT_PUBLIC_SERVER_URL}${doc.meta.image.url}`

  // Categories have their own on-page `description` (rendered under the H1,
  // a plain string) — reused as the meta description when an editor hasn't
  // filled in a dedicated SEO one, so the page never ships with an empty
  // snippet. Guarded by typeof since other doc types in this union have an
  // unrelated `description` field that holds richText, not a string.
  const categoryDescriptionValue: string | null | undefined =
    doc && 'description' in doc && (doc.description === null || typeof doc.description === 'string') ? doc.description : undefined
  const isCategoryLikeDoc = categoryDescriptionValue !== undefined
  const categoryDescription = categoryDescriptionValue || undefined
  // Most categories have neither a dedicated SEO description nor any
  // on-page copy at all — rather than shipping an empty <meta
  // description>, a templated fallback keeps every category page from
  // going out with no snippet for search results to show.
  const categoryFallbackDescription =
    isCategoryLikeDoc && !categoryDescription && doc?.title
      ? `Shop ${doc.title} at Picmychip — verified specs, fast shipping, and expert support for makers and engineers.`
      : undefined
  const description = doc?.meta?.description || categoryDescription || categoryFallbackDescription

  return {
    alternates: {
      canonical: `${getServerSideURL()}${canonicalPath}`,
    },
    description,
    openGraph: mergeOpenGraph({
      ...(description
        ? {
            description,
          }
        : {}),
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title: doc?.meta?.title || doc?.title || 'Picmychip',
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    // A plain fallback title (no dedicated SEO title set) is left byte-
    // identical to the page's H1 elsewhere (duplicate H1/title content)
    // and, for a short doc title like a bare category name ("IC"), too
    // short on its own — the longer tagline fixes both. A doc title that's
    // already substantial only gets the brief brand suffix instead, so
    // this never pushes an already-long title into "too long" territory.
    title:
      doc?.meta?.title ||
      (doc?.title
        ? doc.title.length < 18
          ? `${doc.title} — Picmychip: Electronic Components Store`
          : `${doc.title} — Picmychip`
        : 'Electronic Components Store'),
  }
}
