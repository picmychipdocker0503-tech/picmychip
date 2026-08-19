import type { Brand, Category, Media, Product } from '@/payload-types'

import { ALL_FACET_ATTRIBUTES, FACET_CONFIG } from '@/lib/facetConfig'
import { getMeiliClient, PRODUCTS_INDEX, verifyMeiliConnection } from '@/lib/meilisearch'
import { flattenToSearchText } from '@/lib/searchText'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'

export type ProductSearchDocument = {
  id: string
  title: string
  slug: string
  sku: string | null
  /** Flattened category-spec values: the closest thing this catalog has to configuration data. */
  specsText: string
  description: string
  priceInINR: number | null
  compareAtPriceInINR: number | null
  onSale: boolean
  salePriceInINR: number | null
  saleEndDate: string | null
  isClearance: boolean
  clearanceReason: string | null
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

  // A sale that expired since the last save is still stored as onSale: true
  // until the doc is next written (see deriveSalePricing) — search results
  // must never surface a stale sale badge in the meantime.
  const saleExpired = Boolean(product.saleEndDate && new Date(product.saleEndDate).getTime() < Date.now())

  return {
    id: String(product.id),
    title: product.title,
    slug: product.slug ?? '',
    sku: product.sku ?? null,
    specsText: flattenToSearchText(product.specs),
    description: richTextToPlainText(product.description),
    priceInINR: product.priceInINR ?? null,
    compareAtPriceInINR: product.compareAtPriceInINR ?? null,
    onSale: Boolean(product.onSale) && !saleExpired,
    salePriceInINR: product.salePriceInINR ?? null,
    saleEndDate: product.saleEndDate ?? null,
    isClearance: Boolean(product.isClearance),
    clearanceReason: product.clearanceReason ?? null,
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

const PRODUCT_FILTERABLE_ATTRIBUTES = [
  'categoryIds',
  'specSchemaType',
  'stockStatus',
  'priceInINR',
  'brandName',
  'isGiftCard',
  'onSale',
  'isClearance',
  ...ALL_FACET_ATTRIBUTES,
]

const PRODUCT_SORTABLE_ATTRIBUTES = ['priceInINR', ...RANGE_ATTRIBUTES]

const PRODUCT_SEARCHABLE_ATTRIBUTES = [
  'title',
  'specsText',
  'sku',
  'brandName',
  'categoryTitles',
  'tags',
  'description',
]

export type ProductsIndexStatus = {
  host: string
  healthStatus: string
  indexUid: typeof PRODUCTS_INDEX
  indexCreated: boolean
  filterableAttributes: string[]
  searchableAttributes: string[]
}

const ensureProductsIndex = async (): Promise<boolean> => {
  const client = getMeiliClient()
  const indexes = await client.getRawIndexes({ limit: 1000 })
  const exists = indexes.results.some((index) => index.uid === PRODUCTS_INDEX)

  if (exists) {
    return false
  }

  await client.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' }).waitTask()
  return true
}

/**
 * Idempotent: safe to call on every boot and from the reindex endpoint.
 * Callers are responsible for catching errors when Meilisearch is down.
 */
export const configureProductsIndex = async (): Promise<ProductsIndexStatus> => {
  const connection = await verifyMeiliConnection()
  const client = getMeiliClient()
  const indexCreated = await ensureProductsIndex()
  const index = client.index<ProductSearchDocument>(PRODUCTS_INDEX)

  await index.updateFilterableAttributes(PRODUCT_FILTERABLE_ATTRIBUTES).waitTask()
  await index.updateSortableAttributes(PRODUCT_SORTABLE_ATTRIBUTES).waitTask()
  await index.updateSearchableAttributes(PRODUCT_SEARCHABLE_ATTRIBUTES).waitTask()
  await index
    .updateTypoTolerance({
      minWordSizeForTypos: { oneTypo: 3, twoTypos: 7 },
    })
    .waitTask()

  return {
    host: connection.host,
    healthStatus: connection.healthStatus,
    indexUid: PRODUCTS_INDEX,
    indexCreated,
    filterableAttributes: PRODUCT_FILTERABLE_ATTRIBUTES,
    searchableAttributes: PRODUCT_SEARCHABLE_ATTRIBUTES,
  }
}
