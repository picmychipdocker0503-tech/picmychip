import type { Category, Media, Product } from '@/payload-types'

import { getMeiliClient, PRODUCTS_INDEX } from '@/lib/meilisearch'
import type { ProductSearchDocument } from '@/lib/searchIndex'
import { flattenToSearchText } from '@/lib/searchText'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'
import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'

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

// categoryId and facet values both come straight from URL query params —
// interpolating them unescaped into a Meilisearch filter expression lets a
// crafted `"` break out of the string literal and inject arbitrary filter
// clauses. Escape backslash and double-quote the same way Meilisearch's own
// filter grammar requires inside a quoted string.
const escapeFilterValue = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const buildFilter = (
  categoryId?: string,
  facetFilters?: Record<string, FacetFilterValue>,
  priceMin?: number,
  priceMax?: number,
): string[] => {
  // Gift cards are a checkout instrument, not a component someone browses
  // for — keep them out of the shop/category listing and search suggestions.
  const clauses: string[] = ['isGiftCard = false']

  if (categoryId) {
    clauses.push(`categoryIds = "${escapeFilterValue(categoryId)}"`)
  }

  if (typeof priceMin === 'number') clauses.push(`priceInINR >= ${priceMin}`)
  if (typeof priceMax === 'number') clauses.push(`priceInINR <= ${priceMax}`)

  for (const [attribute, value] of Object.entries(facetFilters ?? {})) {
    if (value.type === 'range') {
      if (typeof value.min === 'number') clauses.push(`${attribute} >= ${value.min}`)
      if (typeof value.max === 'number') clauses.push(`${attribute} <= ${value.max}`)
    } else if (value.type === 'select' && value.values.length > 0) {
      const quoted = value.values.map((v) => `"${escapeFilterValue(v)}"`).join(', ')
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
  onSale: hit.onSale,
  salePriceInINR: hit.salePriceInINR,
  saleEndDate: hit.saleEndDate,
  isClearance: hit.isClearance,
  clearanceReason: hit.clearanceReason,
  stockStatus: hit.stockStatus as Product['stockStatus'],
  categories: hit.categoryIds.map(
    (id, i) => ({ id: Number(id), title: hit.categoryTitles[i] }) as unknown as Category,
  ),
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

// --- Database fallback ------------------------------------------------
//
// Used whenever Meilisearch is unreachable (or unconfigured). The catalog is
// small enough (a few hundred products) that ranking entirely in application
// code — rather than reaching for Postgres full-text/trigram search, which
// would need a schema migration and a new extension — is simple, fast, and
// keeps every searchable field (title, SKU, category/sub-category, brand,
// description, and the free-form category-spec "configuration" values)
// consistent with what Meilisearch already indexes.

type CandidateFields = {
  title: string
  specs: string
  sku: string
  brand: string
  category: string
  tags: string
  description: string
}

export const FIELD_WEIGHTS: Record<keyof CandidateFields, number> = {
  title: 100,
  specs: 80,
  sku: 70,
  brand: 55,
  category: 45,
  tags: 40,
  description: 20,
}

export type { CandidateFields }

type Candidate = {
  product: Partial<Product>
  fields: CandidateFields
}

/** Builds an empty all-fields-blank CandidateFields, for tests/callers constructing a partial one. */
export const emptyCandidateFields = (): CandidateFields => ({
  title: '',
  specs: '',
  sku: '',
  brand: '',
  category: '',
  tags: '',
  description: '',
})

let candidatePoolCache: { fetchedAt: number; data: Candidate[] } | null = null
// Without this, every concurrent request that lands while the cache is
// cold/expired independently fires its own 2000-row query — confirmed live,
// a burst of requests around the same moment intermittently failed /shop
// (the heaviest caller of this) while lighter pages succeeded. Sharing one
// in-flight promise means a burst pays for exactly one query, not N.
let candidatePoolInFlight: Promise<Candidate[]> | null = null
const CANDIDATE_POOL_TTL_MS = 60 * 1000

const buildCategoryTitleMap = async (payload: Awaited<ReturnType<typeof getPayload>>) => {
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { title: true, parent: true },
  })

  const byId = new Map(categories.map((c) => [c.id, c]))

  const titleWithParent = (id: number): string => {
    const category = byId.get(id)
    if (!category) return ''
    const parentId = typeof category.parent === 'object' ? category.parent?.id : category.parent
    const parentTitle = parentId ? byId.get(parentId)?.title : undefined
    return [category.title, parentTitle].filter(Boolean).join(' ')
  }

  return { byId, titleWithParent }
}

const loadCandidatePool = async (): Promise<Candidate[]> => {
  if (candidatePoolCache && Date.now() - candidatePoolCache.fetchedAt < CANDIDATE_POOL_TTL_MS) {
    return candidatePoolCache.data
  }

  if (candidatePoolInFlight) return candidatePoolInFlight

  candidatePoolInFlight = (async () => {
    const payload = await getPayload({ config: configPromise })
    const { titleWithParent } = await buildCategoryTitleMap(payload)

    const { docs } = await payload.find({
      collection: 'products',
      draft: false,
      overrideAccess: false,
      limit: 2000,
      depth: 1,
      pagination: false,
      where: {
        and: [{ _status: { equals: 'published' } }, { isGiftCard: { not_equals: true } }],
      },
      select: {
        title: true,
        slug: true,
        gallery: true,
        categories: true,
        priceInINR: true,
        compareAtPriceInINR: true,
        onSale: true,
        salePriceInINR: true,
        saleEndDate: true,
        isClearance: true,
        clearanceReason: true,
        stockStatus: true,
        createdAt: true,
        sku: true,
        tags: true,
        brand: true,
        description: true,
        specs: true,
      },
    })

    const data: Candidate[] = docs.map((product) => {
      const categoryIds = (product.categories ?? [])
        .map((c) => (typeof c === 'object' ? c?.id : c))
        .filter((id): id is number => typeof id === 'number')

      const brandTitle = typeof product.brand === 'object' ? (product.brand?.title ?? '') : ''

      const fields: CandidateFields = {
        title: (product.title ?? '').toLowerCase(),
        specs: flattenToSearchText(product.specs).toLowerCase(),
        sku: (product.sku ?? '').toLowerCase(),
        brand: brandTitle.toLowerCase(),
        category: categoryIds.map(titleWithParent).join(' ').toLowerCase(),
        tags: (product.tags?.filter((t): t is string => Boolean(t)) ?? []).join(' ').toLowerCase(),
        description: richTextToPlainText(product.description).toLowerCase(),
      }

      return { product, fields }
    })

    candidatePoolCache = { fetchedAt: Date.now(), data }
    return data
  })()

  try {
    return await candidatePoolInFlight
  } finally {
    candidatePoolInFlight = null
  }
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** No `g` flag, so `.test()` is stateless — safe to compile once per query word and reuse across every candidate. */
const compileWordRegex = (word: string): RegExp => new RegExp(`\\b${escapeRegExp(word)}\\b`)

/**
 * Per query word, credits the highest-weighted field it appears in (a whole-
 * word match scores full weight; a mid-token substring match scores partly),
 * plus a phrase bonus when the full query appears verbatim in the title.
 *
 * `wordRegexes`, when given, must align 1:1 with `queryWords` — callers
 * scoring many candidates against the same query (searchViaDatabase) compile
 * these once up front instead of re-compiling a RegExp per field per
 * candidate. Omitted by `scoreCandidateForQuery`, which scores a single
 * candidate and has nothing to amortize the compilation over.
 */
export const scoreCandidate = (
  fields: CandidateFields,
  queryWords: string[],
  fullQueryLower: string,
  wordRegexes?: RegExp[],
): { score: number; matchedWordCount: number } => {
  let score = 0
  let matchedWordCount = 0

  for (let i = 0; i < queryWords.length; i++) {
    const word = queryWords[i]
    const wholeWordRegex = wordRegexes?.[i] ?? compileWordRegex(word)
    let bestFieldScore = 0
    for (const key of Object.keys(FIELD_WEIGHTS) as (keyof CandidateFields)[]) {
      const text = fields[key]
      if (!text || !text.includes(word)) continue
      const wholeWord = wholeWordRegex.test(text)
      const fieldScore = FIELD_WEIGHTS[key] * (wholeWord ? 1 : 0.6)
      if (fieldScore > bestFieldScore) bestFieldScore = fieldScore
    }
    if (bestFieldScore > 0) {
      matchedWordCount++
      score += bestFieldScore
    }
  }

  if (fullQueryLower.length > 0 && fields.title.includes(fullQueryLower)) {
    score += 50
  }

  return { score, matchedWordCount }
}

/**
 * Normalizes a raw query the same way searchViaDatabase does (trim, collapse
 * whitespace, lowercase, split on spaces) and scores a single candidate
 * against it — the same code path used per-item during a real search,
 * exposed directly so tests can exercise it without a live database.
 */
export const scoreCandidateForQuery = (fields: CandidateFields, query: string) => {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ')
  const queryWords = normalizedQuery.toLowerCase().split(' ').filter(Boolean)
  return scoreCandidate(fields, queryWords, normalizedQuery.toLowerCase())
}

const searchViaDatabase = async (args: SearchProductsArgs): Promise<SearchProductsResult> => {
  const { query, categoryId, sort, page = 1, limit = 12, priceMin, priceMax } = args

  let pool = await loadCandidatePool()

  if (categoryId) {
    const categoryIdNum = Number(categoryId)
    pool = pool.filter((c) =>
      (c.product.categories ?? []).some((cat) => (typeof cat === 'object' ? cat?.id : cat) === categoryIdNum),
    )
  }
  if (typeof priceMin === 'number') {
    pool = pool.filter((c) => typeof c.product.priceInINR === 'number' && c.product.priceInINR >= priceMin)
  }
  if (typeof priceMax === 'number') {
    pool = pool.filter((c) => typeof c.product.priceInINR === 'number' && c.product.priceInINR <= priceMax)
  }

  // Collapse repeated whitespace so "hand   crimper" behaves like "hand crimper".
  const normalizedQuery = (query ?? '').trim().replace(/\s+/g, ' ')
  const queryWords = normalizedQuery.toLowerCase().split(' ').filter(Boolean)

  type Ranked = { product: Partial<Product>; score: number; matchedWordCount: number }
  let ranked: Ranked[]

  if (queryWords.length === 0) {
    ranked = pool.map((c) => ({ product: c.product, score: 0, matchedWordCount: 0 }))
  } else {
    const fullQueryLower = normalizedQuery.toLowerCase()
    const wordRegexes = queryWords.map(compileWordRegex)
    ranked = pool
      .map((c) => ({ product: c.product, ...scoreCandidate(c.fields, queryWords, fullQueryLower, wordRegexes) }))
      .filter((c) => c.matchedWordCount > 0)
  }

  const totalWords = queryWords.length

  if (sort) {
    const desc = sort.startsWith('-')
    const field = (desc ? sort.slice(1) : sort) as keyof Product
    ranked.sort((a, b) => {
      // Even with an explicit sort, an all-keyword match still outranks a partial one.
      const aAll = totalWords === 0 || a.matchedWordCount === totalWords ? 1 : 0
      const bAll = totalWords === 0 || b.matchedWordCount === totalWords ? 1 : 0
      if (aAll !== bAll) return bAll - aAll

      const aValue = a.product[field]
      const bValue = b.product[field]
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      const cmp = aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      return desc ? -cmp : cmp
    })
  } else if (queryWords.length === 0) {
    ranked.sort((a, b) => (a.product.title ?? '').localeCompare(b.product.title ?? ''))
  } else {
    ranked.sort((a, b) => {
      const aAll = a.matchedWordCount === totalWords ? 1 : 0
      const bAll = b.matchedWordCount === totalWords ? 1 : 0
      if (aAll !== bAll) return bAll - aAll
      if (b.score !== a.score) return b.score - a.score
      const lenDiff = (a.product.title?.length ?? 0) - (b.product.title?.length ?? 0)
      if (lenDiff !== 0) return lenDiff
      return (a.product.title ?? '').localeCompare(b.product.title ?? '')
    })
  }

  const totalDocs = ranked.length
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
  const start = (page - 1) * limit
  const docs = ranked.slice(start, start + limit).map((r) => r.product)

  return {
    docs,
    totalDocs,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    facetDistribution: undefined,
    source: 'fallback',
  }
}

// Circuit breaker: once Meilisearch fails once, skip straight to the
// database fallback for a short window instead of re-paying the (now
// timeout-bounded, but still real) network round-trip on every single
// request during an outage. Self-heals — the next request after the window
// elapses tries Meilisearch again and closes the breaker on success.
const MEILI_BREAKER_MS = 15_000
let meiliDownUntil = 0

/**
 * Tries Meilisearch first; on ANY failure (unreachable, index missing, bad
 * filter, etc.) transparently falls back to the equivalent database query,
 * with facets simply absent. Callers should never need their own try/catch
 * around a listing query.
 */
export const searchProducts = async (args: SearchProductsArgs): Promise<SearchProductsResult> => {
  if (Date.now() < meiliDownUntil) {
    return searchViaDatabase(args)
  }

  try {
    const result = await searchViaMeilisearch(args)
    meiliDownUntil = 0
    return result
  } catch {
    meiliDownUntil = Date.now() + MEILI_BREAKER_MS
    return await searchViaDatabase(args)
  }
}
