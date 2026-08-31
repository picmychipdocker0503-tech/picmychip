import type { Metadata } from 'next'

import { ActiveFiltersBar } from '@/components/Search/ActiveFiltersBar'
import { FacetSidebar } from '@/components/Search/FacetSidebar'
import { ShopResults } from '@/components/Search/ShopResults'
import { MobileFilterDrawer } from '@/components/layout/search/MobileFilterDrawer'
import { EmptyState } from '@/components/illustrations'
import { getAverageRatings } from '@/lib/getAverageRatings'
import { getFacetsForSchema } from '@/lib/facetConfig'
import { parseFacetFilters } from '@/lib/facetParams'
import { searchProducts } from '@/lib/searchProducts'
import { getServerSideURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import { Suspense } from 'react'

const PRODUCTS_PER_PAGE = 12

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = await searchParams
  const pageNum = Number(page) || 1

  return {
    alternates: {
      canonical: `${getServerSideURL()}/shop${pageNum > 1 ? `?page=${pageNum}` : ''}`,
    },
    description: 'Search for products in the store.',
    title: pageNum > 1 ? `Shop — Page ${pageNum}` : 'Shop — Picmychip: Electronic Components Store',
  }
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams
  const { q: searchValue, sort, category, page, priceMin, priceMax } = params
  const pageNum = Number(page) || 1
  const categoryId = typeof category === 'string' ? category : undefined
  const priceMinNum = typeof priceMin === 'string' ? Number(priceMin) : undefined
  const priceMaxNum = typeof priceMax === 'string' ? Number(priceMax) : undefined

  let facets: ReturnType<typeof getFacetsForSchema> = []
  if (categoryId) {
    const payload = await getPayload({ config: configPromise })
    const categoryDoc = await payload.findByID({ collection: 'categories', id: categoryId }).catch(() => null)
    facets = getFacetsForSchema(categoryDoc?.specSchemaType)
  }

  const products = await searchProducts({
    query: typeof searchValue === 'string' ? searchValue : undefined,
    categoryId,
    facetFilters: parseFacetFilters(params, facets),
    facetAttributes: facets.map((facet) => facet.attribute),
    sort: typeof sort === 'string' ? sort : undefined,
    page: pageNum,
    limit: PRODUCTS_PER_PAGE,
    priceMin: Number.isFinite(priceMinNum) ? priceMinNum : undefined,
    priceMax: Number.isFinite(priceMaxNum) ? priceMaxNum : undefined,
  })

  const payloadForRatings = await getPayload({ config: configPromise })
  const ratingsMap = await getAverageRatings(
    payloadForRatings,
    products.docs.map((product) => product.id).filter((id): id is number => typeof id === 'number'),
  )
  const ratings = Object.fromEntries(ratingsMap)

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  const resultsKey = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) =>
      key === 'page' ? [] : Array.isArray(value) ? value.map((v) => [key, v]) : value ? [[key, value]] : [],
    ),
  ).toString()

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      {products.facetDistribution && facets.length > 0 && (
        <MobileFilterDrawer>
          <Suspense fallback={null}>
            <FacetSidebar facetDistribution={products.facetDistribution} facets={facets} />
          </Suspense>
        </MobileFilterDrawer>
      )}

      <div className="min-h-screen w-full flex-1">
        {facets.length > 0 && (
          <Suspense fallback={null}>
            <ActiveFiltersBar facets={facets} />
          </Suspense>
        )}

        {searchValue && products.docs?.length > 0 ? (
          <p className="mb-6 text-sm text-muted-foreground">
            {`Showing ${products.docs.length} ${resultsText} for `}
            <span className="font-semibold text-primary">&quot;{searchValue}&quot;</span>
          </p>
        ) : null}

        {products.docs?.length === 0 && (
          <div className="border-border bg-card mb-6 flex flex-col items-center gap-4 rounded-3xl border p-10 text-center sm:p-14">
            <EmptyState className="text-muted-foreground/40 size-24" />
            <div>
              <h2 className="text-foreground text-lg font-semibold">
                {searchValue ? <>No results for &ldquo;{searchValue}&rdquo;</> : 'No products found'}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {searchValue
                  ? 'Check the spelling, try a shorter term, or search by category (e.g. "resistor").'
                  : 'Try adjusting or clearing your filters.'}
              </p>
            </div>
            <Link
              className="border-border text-foreground hover:border-primary/40 hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
              href="/shop"
            >
              Browse all products
            </Link>
          </div>
        )}

        {products?.docs.length > 0 ? (
          <ShopResults
            hasNextPage={products.hasNextPage}
            key={resultsKey}
            products={products.docs}
            ratings={ratings}
            totalDocs={products.totalDocs}
          />
        ) : null}
      </div>
    </div>
  )
}
