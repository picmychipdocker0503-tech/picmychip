import type { Metadata } from 'next'

import type { Category, Guide, Page, Product } from '../payload-types'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

export const generateMeta = async (args: {
  doc: Page | Product | Category | Guide
  path?: string
}): Promise<Metadata> => {
  const { doc, path } = args || {}

  const canonicalPath = path ?? (Array.isArray(doc?.slug) ? `/${doc.slug.join('/')}` : `/${doc?.slug ?? ''}`)

  const ogImage =
    typeof doc?.meta?.image === 'object' &&
    doc.meta.image !== null &&
    'url' in doc.meta.image &&
    `${process.env.NEXT_PUBLIC_SERVER_URL}${doc.meta.image.url}`

  return {
    alternates: {
      canonical: `${getServerSideURL()}${canonicalPath}`,
    },
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      ...(doc?.meta?.description
        ? {
            description: doc?.meta?.description,
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
    title: doc?.meta?.title || doc?.title || 'Payload Ecommerce Template',
  }
}
