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
  const categoryDescription = doc && 'description' in doc && typeof doc.description === 'string' ? doc.description : undefined
  const description = doc?.meta?.description || categoryDescription

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
    title: doc?.meta?.title || doc?.title || 'Electronic Components Store',
  }
}
