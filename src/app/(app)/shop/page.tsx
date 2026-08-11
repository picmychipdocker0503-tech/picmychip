import type { Metadata } from 'next'

import { ActiveFiltersBar } from '@/components/Search/ActiveFiltersBar'
import { FacetSidebar } from '@/components/Search/FacetSidebar'
import { ShopResults } from '@/components/Search/ShopResults'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import { getAverageRatings } from '@/lib/getAverageRatings'
import { getFacetsForSchema } from '@/lib/facetConfig'
import { parseFacetFilters } from '@/lib/facetParams'
import { searchProducts } from '@/lib/searchProducts'
import { getServerSideURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
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
    title: 'Shop',
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

  const otherParams = new URLSearchParams()
  if (searchValue) otherParams.set('q', String(searchValue))
  if (sort) otherParams.set('sort', String(sort))
  if (category) otherParams.set('category', String(category))

  const pageHref = (targetPage: number) => {
    const searchParamsForPage = new URLSearchParams(otherParams)
    searchParamsForPage.set('page', String(targetPage))
    return `/shop?${searchParamsForPage.toString()}`
  }

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <Suspense fallback={null}>
        <FacetSidebar facetDistribution={products.facetDistribution} facets={facets} />
      </Suspense>

      <div className="min-h-screen w-full flex-1">
        {facets.length > 0 && (
          <Suspense fallback={null}>
            <ActiveFiltersBar facets={facets} />
          </Suspense>
        )}

        {searchValue ? (
          <p className="mb-6 text-sm text-muted-foreground">
            {products.docs?.length === 0
              ? 'There are no products that match '
              : `Showing ${products.docs.length} ${resultsText} for `}
            <span className="font-semibold text-primary">&quot;{searchValue}&quot;</span>
          </p>
        ) : null}

        {!searchValue && products.docs?.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-10 mb-6 text-center">
            <p className="text-muted-foreground">No products found. Please try different filters.</p>
          </div>
        )}

        {products?.docs.length > 0 ? (
          <ShopResults products={products.docs} ratings={ratings} totalDocs={products.totalDocs} />
        ) : null}

        {products.totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <Pagination>
              <PaginationContent>
                {products.hasPrevPage && (
                  <PaginationItem>
                    <PaginationPrevious href={pageHref(pageNum - 1)} />
                  </PaginationItem>
                )}
                {products.hasNextPage && (
                  <PaginationItem>
                    <PaginationNext href={pageHref(pageNum + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}
