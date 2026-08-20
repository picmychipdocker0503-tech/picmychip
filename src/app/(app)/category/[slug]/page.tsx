import type { Metadata } from 'next'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { ActiveFiltersBar } from '@/components/Search/ActiveFiltersBar'
import { CategoryResults } from '@/components/Search/CategoryResults'
import { FacetSidebar } from '@/components/Search/FacetSidebar'
import { getIllustration } from '@/components/illustrations'
import { getAverageRatings } from '@/lib/getAverageRatings'
import { getFacetsForSchema } from '@/lib/facetConfig'
import { parseFacetFilters } from '@/lib/facetParams'
import { searchProducts } from '@/lib/searchProducts'
import { generateMeta } from '@/utilities/generateMeta'
import { getCategoryBreadcrumb } from '@/utilities/getCategoryBreadcrumb'
import { getServerSideURL } from '@/utilities/getURL'
import { buildBreadcrumbListJsonLd, buildCollectionPageJsonLd } from '@/utilities/jsonLd'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React, { Suspense } from 'react'

const PRODUCTS_PER_PAGE = 12

type SearchParams = { [key: string]: string | string[] | undefined }

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<SearchParams>
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'categories',
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return categories.docs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  const { slug } = await params
  const { page } = await searchParams
  const category = await queryCategoryBySlug({ slug })

  if (!category) return notFound()

  const pageNum = Number(page) || 1

  return generateMeta({
    doc: category,
    path: `/category/${slug}${pageNum > 1 ? `?page=${pageNum}` : ''}`,
  })
}

export default async function CategoryPage({ params, searchParams }: Args) {
  const { slug } = await params
  const query = await searchParams
  const category = await queryCategoryBySlug({ slug })

  if (!category) return notFound()

  const pageNum = Number(query.page) || 1
  const payload = await getPayload({ config: configPromise })

  const facets = getFacetsForSchema(category.specSchemaType)

  const products = await searchProducts({
    categoryId: String(category.id),
    facetFilters: parseFacetFilters(query, facets),
    facetAttributes: facets.map((facet) => facet.attribute),
    page: pageNum,
    limit: PRODUCTS_PER_PAGE,
  })

  const ratingsMap = await getAverageRatings(
    payload,
    products.docs.map((product) => product.id).filter((id): id is number => typeof id === 'number'),
  )
  const ratings = Object.fromEntries(ratingsMap)

  const resultsKey = new URLSearchParams(
    Object.entries(query).flatMap(([key, value]) =>
      key === 'page' ? [] : Array.isArray(value) ? value.map((v) => [key, v]) : value ? [[key, value]] : [],
    ),
  ).toString()

  const Illustration = getIllustration(category.specSchemaType)

  const breadcrumb = await getCategoryBreadcrumb(payload, category)
  const categoryUrl = `${getServerSideURL()}/category/${category.slug}`

  const collectionPageJsonLd = buildCollectionPageJsonLd({
    name: category.title,
    description: category.description,
    url: categoryUrl,
    items: products.docs.map((product) => ({
      name: product.title || '',
      url: `${getServerSideURL()}/products/${product.slug}`,
      imageUrl:
        product.gallery?.[0]?.image && typeof product.gallery[0].image === 'object'
          ? product.gallery[0].image.url
          : undefined,
    })),
  })

  return (
    <div className="pt-16 pb-24">
      <JsonLd data={buildBreadcrumbListJsonLd(breadcrumb)} />
      <JsonLd data={collectionPageJsonLd} />
      <div className="container mb-14 flex flex-col items-center gap-3 text-center">
        <div className="bg-muted text-muted-foreground flex size-20 items-center justify-center rounded-full">
          <Illustration className="size-10" />
        </div>
        <span className="eyebrow">Category</span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{category.title}</h1>
        {category.description && (
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">{category.description}</p>
        )}
      </div>

      {category.layout?.length ? <RenderBlocks blocks={category.layout} /> : null}

      <div className="container flex flex-col gap-8 md:flex-row md:items-start">
        <Suspense fallback={null}>
          <FacetSidebar facetDistribution={products.facetDistribution} facets={facets} />
        </Suspense>

        <div className="min-h-screen w-full">
          {facets.length > 0 && (
            <Suspense fallback={null}>
              <ActiveFiltersBar facets={facets} />
            </Suspense>
          )}

          {products.docs.length > 0 ? (
            <CategoryResults
              categoryId={String(category.id)}
              hasNextPage={products.hasNextPage}
              key={resultsKey}
              products={products.docs}
              ratings={ratings}
              totalDocs={products.totalDocs}
            />
          ) : (
            <p className="text-muted-foreground">No products in this category yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const queryCategoryBySlug = async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'categories',
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
}
