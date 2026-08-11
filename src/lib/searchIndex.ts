import type { Category, Media, Product } from '@/payload-types'

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
  imageUrl: string | null
  imageAlt: string | null
  inventory: number | null
}

export const toSearchDocument = (product: Product): ProductSearchDocument => {
  const categories = (product.categories ?? []).filter(
    (category): category is Category => typeof category === 'object',
  )

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
    imageUrl: firstImage?.url ?? null,
    imageAlt: firstImage?.alt ?? null,
    inventory: product.inventory ?? null,
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
    ...ALL_FACET_ATTRIBUTES,
  ])
  await index.updateSortableAttributes(['priceInINR', ...RANGE_ATTRIBUTES])
  await index.updateSearchableAttributes(['title', 'description'])
}
