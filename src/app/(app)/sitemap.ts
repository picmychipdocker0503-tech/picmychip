import type { MetadataRoute } from 'next'

import { getServerSideURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getServerSideURL()
  const payload = await getPayload({ config: configPromise })

  const [pages, products, categories, guides] = await Promise.all([
    payload.find({
      collection: 'pages',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'products',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'categories',
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'guides',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, updatedAt: true, authorName: true },
      where: { _status: { equals: 'published' } },
    }),
  ])

  const pageEntries = pages.docs
    .filter((page) => page.slug !== 'home')
    .map((page) => ({ url: `${baseUrl}/${page.slug}`, lastModified: page.updatedAt }))

  const productEntries = products.docs.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
  }))

  const categoryEntries = categories.docs.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: category.updatedAt,
  }))

  // Author-bylined guides live at /blog instead of /guides — keep the two
  // listings' sitemap entries pointed at the URLs that actually serve them.
  const guideEntries = guides.docs
    .filter((guide) => !guide.authorName)
    .map((guide) => ({ url: `${baseUrl}/guides/${guide.slug}`, lastModified: guide.updatedAt }))

  const blogEntries = guides.docs
    .filter((guide) => guide.authorName)
    .map((guide) => ({ url: `${baseUrl}/blog/${guide.slug}`, lastModified: guide.updatedAt }))

  return [
    { url: baseUrl },
    { url: `${baseUrl}/shop` },
    { url: `${baseUrl}/guides` },
    { url: `${baseUrl}/blog` },
    ...pageEntries,
    ...productEntries,
    ...categoryEntries,
    ...guideEntries,
    ...blogEntries,
  ]
}
