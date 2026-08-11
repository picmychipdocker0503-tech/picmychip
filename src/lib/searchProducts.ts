import type { Media, Product } from '@/payload-types'

import { getMeiliClient, PRODUCTS_INDEX } from '@/lib/meilisearch'
import type { ProductSearchDocument } from '@/lib/searchIndex'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type FacetFilterValue =
  | { type: 'range'; min?: number; max?: number }
  | { type: 'select'; values: string[] }

export type SearchProductsArgs = {
  query?: string
  categoryId?: string
  facetFilters?: Record<string, FacetFilterValue>
  facetAttributes?: string[]
  sort?: string | null
  page?: number
  limit?: number
  priceMin?: number
  priceMax?: number
}

export type SearchProductsResult = {
  docs: Partial<Product>[]
  totalDocs: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  facetDistribution?: Record<string, Record<string, number>>
  source: 'meilisearch' | 'fallback'
}

const toMeiliSort = (sort?: string | null): string[] | undefined => {
  if (!sort) return undefined
  if (sort.startsWith('-')) return [`${sort.slice(1)}:desc`]
  return [`${sort}:asc`]
}

const buildFilter = (
  categoryId?: string,
  facetFilters?: Record<string, FacetFilterValue>,
  priceMin?: number,
  priceMax?: number,
): string[] => {
  const clauses: string[] = []

  if (categoryId) {
    clauses.push(`categoryIds = "${categoryId}"`)
  }

  if (typeof priceMin === 'number') clauses.push(`priceInINR >= ${priceMin}`)
  if (typeof priceMax === 'number') clauses.push(`priceInINR <= ${priceMax}`)

  for (const [attribute, value] of Object.entries(facetFilters ?? {})) {
    if (value.type === 'range') {
      if (typeof value.min === 'number') clauses.push(`${attribute} >= ${value.min}`)
      if (typeof value.max === 'number') clauses.push(`${attribute} <= ${value.max}`)
    } else if (value.type === 'select' && value.values.length > 0) {
      const quoted = value.values.map((v) => `"${v}"`).join(', ')
      clauses.push(`${attribute} IN [${quoted}]`)
    }
  }

  return clauses
}

const hitToProduct = (hit: ProductSearchDocument): Partial<Product> => ({
  id: Number(hit.id),
  title: hit.title,
  slug: hit.slug,
  priceInINR: hit.priceInINR,
  compareAtPriceInINR: hit.compareAtPriceInINR,
  stockStatus: hit.stockStatus as Product['stockStatus'],
  categories: hit.categoryIds.map(Number),
  gallery: hit.imageUrl
    ? [{ image: { url: hit.imageUrl, alt: hit.imageAlt ?? '' } as Media, id: null }]
    : [],
})

const searchViaMeilisearch = async (args: SearchProductsArgs): Promise<SearchProductsResult> => {
  const { query = '', categoryId, facetFilters, facetAttributes, sort, page = 1, limit = 12, priceMin, priceMax } = args

  const client = getMeiliClient()
  const index = client.index<ProductSearchDocument>(PRODUCTS_INDEX)

  const response = await index.search(query, {
    filter: buildFilter(categoryId, facetFilters, priceMin, priceMax).join(' AND ') || undefined,
    facets: facetAttributes?.length ? facetAttributes : undefined,
    sort: toMeiliSort(sort),
    page,
    hitsPerPage: limit,
  })

  return {
    docs: response.hits.map(hitToProduct),
    totalDocs: response.totalHits ?? response.hits.length,
    totalPages: response.totalPages ?? 1,
    hasNextPage: (response.page ?? 1) < (response.totalPages ?? 1),
    hasPrevPage: (response.page ?? 1) > 1,
    facetDistribution: response.facetDistribution as Record<string, Record<string, number>> | undefined,
    source: 'meilisearch',
  }
}

const searchViaMongo = async (args: SearchProductsArgs): Promise<SearchProductsResult> => {
  const { query, categoryId, sort, page = 1, limit = 12, priceMin, priceMax } = args

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    page,
    limit,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInINR: true,
      compareAtPriceInINR: true,
      stockStatus: true,
    },
    sort: sort || 'title',
    where: {
      and: [
        { _status: { equals: 'published' } },
        // `description` is richText (jsonb) — Postgres can't `ilike` it directly
        // without a cast, so the DB fallback only matches on `title`/`tags`.
        ...(query
          ? [
              {
                or: [{ title: { like: query } }, { tags: { like: query } }],
              },
            ]
          : []),
        ...(categoryId ? [{ categories: { contains: categoryId } }] : []),
        ...(typeof priceMin === 'number' ? [{ priceInINR: { greater_than_equal: priceMin } }] : []),
        ...(typeof priceMax === 'number' ? [{ priceInINR: { less_than_equal: priceMax } }] : []),
      ],
    },
  })

  return {
    docs: result.docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    facetDistribution: undefined,
    source: 'fallback',
  }
}

/**
 * Tries Meilisearch first; on ANY failure (unreachable, index missing, bad
 * filter, etc.) transparently falls back to the equivalent Mongo query, with
 * facets simply absent. Callers should never need their own try/catch around
 * a listing query.
 */
export const searchProducts = async (args: SearchProductsArgs): Promise<SearchProductsResult> => {
  try {
    return await searchViaMeilisearch(args)
  } catch {
    return await searchViaMongo(args)
  }
}
