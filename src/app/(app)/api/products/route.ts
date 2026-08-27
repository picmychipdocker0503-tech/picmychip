import { getAverageRatings } from '@/lib/getAverageRatings'
import { getFacetsForSchema } from '@/lib/facetConfig'
import { parseFacetFilters } from '@/lib/facetParams'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { searchProducts } from '@/lib/searchProducts'
import configPromise from '@payload-config'
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

const PRODUCTS_PER_PAGE = 12

// This file's GET override shadows Payload's generated `[...slug]` REST route
// for the exact path `/api/products` (Next.js matches the more specific
// static route first). Without these, the admin panel's bulk edit/publish/
// unpublish/delete actions and "create new product" all PATCH/DELETE/POST
// this same path and get a 405 — only single-doc routes like
// `/api/products/:id` still hit the catch-all and work. Payload's REST
// handlers read the collection slug from the dynamic route's `params.slug`,
// which doesn't exist on this static route, so it's supplied manually.
const restParams = { params: Promise.resolve({ slug: ['products'] }) }
export const POST = (request: NextRequest) => REST_POST(configPromise)(request, restParams)
export const PATCH = (request: NextRequest) => REST_PATCH(configPromise)(request, restParams)
export const DELETE = (request: NextRequest) => REST_DELETE(configPromise)(request, restParams)

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  // The admin panel's DataTable (useServerTable) hits this same path with
  // Payload-style `where[...]` bracket params — the storefront's shop page
  // never sends those (it uses `q`/`category`/`sort`/`priceMin`/`priceMax`
  // instead), so their presence reliably means this is an admin list-view
  // request, not a public search. Delegating those to Payload's own REST GET
  // is what actually applies the `where` filter — the custom search logic
  // below only understands the storefront's own param shape and was
  // silently ignoring `where` entirely, so the admin search box did nothing.
  const isAdminTableRequest = [...params.keys()].some((key) => key.startsWith('where'))
  if (isAdminTableRequest) {
    return REST_GET(configPromise)(request, restParams)
  }

  const ip = getClientIp(request.headers)
  const { allowed } = checkRateLimit(`products-load-more:${ip}`, 60, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const searchValue = params.get('q') ?? undefined
  const sort = params.get('sort') ?? undefined
  const categoryId = params.get('category') ?? undefined
  const page = Number(params.get('page')) || 1
  const priceMinNum = Number(params.get('priceMin'))
  const priceMaxNum = Number(params.get('priceMax'))

  const paramsRecord = Object.fromEntries(params.entries())

  let facets: ReturnType<typeof getFacetsForSchema> = []
  if (categoryId) {
    const payload = await getPayload({ config: configPromise })
    const categoryDoc = await payload.findByID({ collection: 'categories', id: categoryId }).catch(() => null)
    facets = getFacetsForSchema(categoryDoc?.specSchemaType)
  }

  const products = await searchProducts({
    query: searchValue,
    categoryId,
    facetFilters: parseFacetFilters(paramsRecord, facets),
    facetAttributes: facets.map((facet) => facet.attribute),
    sort,
    page,
    limit: PRODUCTS_PER_PAGE,
    priceMin: Number.isFinite(priceMinNum) && params.has('priceMin') ? priceMinNum : undefined,
    priceMax: Number.isFinite(priceMaxNum) && params.has('priceMax') ? priceMaxNum : undefined,
  })

  const payload = await getPayload({ config: configPromise })
  const ratingsMap = await getAverageRatings(
    payload,
    products.docs.map((product) => product.id).filter((id): id is number => typeof id === 'number'),
  )
  const ratings = Object.fromEntries(ratingsMap)

  return NextResponse.json({
    docs: products.docs,
    ratings,
    hasNextPage: products.hasNextPage,
    totalDocs: products.totalDocs,
  })
}
