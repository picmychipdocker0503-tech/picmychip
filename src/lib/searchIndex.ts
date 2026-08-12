import type { Brand, Category, Media, Product } from '@/payload-types'

import { ALL_FACET_ATTRIBUTES, FACET_CONFIG } from '@/lib/facetConfig'
import { getMeiliClient, PRODUCTS_INDEX } from '@/lib/meilisearch'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'

export type ProductSearchDocument = {
  id: string
  title: string
  slug: string
  description: string
  priceInINR: number | null
  compareAtPriceInINR: number | null
  stockStatus: string | null
  specSchemaType: string | null
  specs: Product['specs']
  categoryIds: string[]
  categoryTitles: string[]
  brandName: string | null
  tags: string[]
  imageUrl: string | null
  imageAlt: string | null
  inventory: number | null
  isGiftCard: boolean
}

export const toSearchDocument = (product: Product): ProductSearchDocument => {
  const categories = (product.categories ?? []).filter(
    (category): category is Category => typeof category === 'object',
  )

  const brand = typeof product.brand === 'object' ? (product.brand as Brand | null) : null

  const firstImage = product.gallery?.find((item) => typeof item.image === 'object')?.image as
    | Media
    | undefined

  return {
    id: String(product.id),
    title: product.title,
    slug: product.slug ?? '',
    description: richTextToPlainText(product.description),
    priceInINR: product.priceInINR ?? null,
    compareAtPriceInINR: product.compareAtPriceInINR ?? null,
    stockStatus: product.stockStatus ?? null,
    specSchemaType: product.specSchemaType ?? null,
    specs: product.specs,
    categoryIds: categories.map((category) => String(category.id)),
    categoryTitles: categories.map((category) => category.title),
    brandName: brand?.title ?? null,
    tags: product.tags?.filter((tag): tag is string => Boolean(tag)) ?? [],
    imageUrl: firstImage?.url ?? null,
    imageAlt: firstImage?.alt ?? null,
    inventory: product.inventory ?? null,
    isGiftCard: Boolean(product.isGiftCard),
  }
}

const RANGE_ATTRIBUTES = Object.values(FACET_CONFIG).flatMap((facets) =>
  (facets ?? []).filter((facet) => facet.type === 'range').map((facet) => facet.attribute),
)

/**
 * Idempotent — safe to call on every boot and from the reindex endpoint.
 * Callers are responsible for catching errors (Meilisearch may be down).
 */
export const configureProductsIndex = async (): Promise<void> => {
  const client = getMeiliClient()
  const index = client.index<ProductSearchDocument>(PRODUCTS_INDEX)

  await index.updateFilterableAttributes([
    'categoryIds',
    'specSchemaType',
    'stockStatus',
    'priceInINR',
    'brandName',
    'isGiftCard',
    ...ALL_FACET_ATTRIBUTES,
  ])
  await index.updateSortableAttributes(['priceInINR', ...RANGE_ATTRIBUTES])
  // Order matters — it's the tie-breaking attribute-rank signal, so a query
  // that matches the title should always outrank one that only matches
  // deep in the description.
  await index.updateSearchableAttributes(['title', 'brandName', 'categoryTitles', 'tags', 'description'])
  // Product titles here are largely manufacturer part numbers
  // (e.g. "RC0805JR-070RL"), which read as one long token to a typo-tolerance
  // algorithm tuned for prose. Loosening these thresholds lets a couple of
  // mistyped characters in a part number still resolve correctly.
  await index.updateTypoTolerance({
    minWordSizeForTypos: { oneTypo: 3, twoTypos: 7 },
  })
}
