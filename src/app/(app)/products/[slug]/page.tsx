import type { Category, Media, Product } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { getCategoryIcon } from '@/components/illustrations/categoryIcons'
import { ProductGridItem } from '@/components/ProductGridItem'
import { JsonLd } from '@/components/JsonLd'
import { Datasheets } from '@/components/product/Datasheets'
import { FrequentlyBoughtTogether } from '@/components/product/FrequentlyBoughtTogether'
import { Gallery } from '@/components/product/Gallery'
import { PriceTiers } from '@/components/product/PriceTiers'
import { ProductDescription } from '@/components/product/ProductDescription'
import { ProductFaqs } from '@/components/product/ProductFaqs'
import { ProductReviews } from '@/components/product/ProductReviews'
import { RecentlyViewedProducts } from '@/components/product/RecentlyViewedProducts'
import { SpecTable } from '@/components/product/SpecTable'
import { TrackProductView } from '@/components/product/TrackProductView'
import { TrackRecentlyViewed } from '@/components/product/TrackRecentlyViewed'
import { getAlsoBoughtProducts } from '@/lib/getAlsoBoughtProducts'
import { getCategoryBreadcrumb } from '@/utilities/getCategoryBreadcrumb'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getServerSideURL } from '@/utilities/getURL'
import { buildBreadcrumbListJsonLd, buildProductJsonLd } from '@/utilities/jsonLd'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'
import configPromise from '@payload-config'
import { ImageOffIcon } from 'lucide-react'
import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'

type Args = {
  params: Promise<{
    slug: string
  }>
}

/**
 * Without this, every product page rendered dynamically on every request —
 * a full set of DB queries (product, reviews, related products, category
 * breadcrumb, "also bought") re-run per visit instead of once at build time.
 * Freshness after publish is handled by revalidateProduct (afterChange hook
 * on the Products collection), the same pattern Pages already uses.
 */
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const products = await payload.find({
    collection: 'products',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
    where: { _status: { equals: 'published' } },
  })

  return products.docs?.filter((doc) => doc.slug).map(({ slug }) => ({ slug })) ?? []
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery = product.gallery?.filter((item) => typeof item.image === 'object') || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const canIndex = product._status === 'published'

  const seoImage = metaImage || (gallery.length ? (gallery[0]?.image as Media) : undefined)

  return {
    alternates: {
      canonical: `${getServerSideURL()}/products/${slug}`,
    },
    description: product.meta?.description || '',
    openGraph: seoImage?.url
      ? {
          images: [
            {
              alt: seoImage?.alt,
              height: seoImage.height!,
              url: seoImage?.url,
              width: seoImage.width!,
            },
          ],
        }
      : null,
    robots: {
      follow: canIndex,
      googleBot: {
        follow: canIndex,
        index: canIndex,
      },
      index: canIndex,
    },
    title: product.meta?.title || product.title,
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery =
    product.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as Media,
      })) || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const hasStock = product.enableVariants
    ? product?.variants?.docs?.some((variant) => {
        if (typeof variant !== 'object') return false
        return variant.inventory && variant?.inventory > 0
      })
    : product.inventory! > 0

  let price = product.priceInINR
  let lowPrice: number | undefined
  let highPrice: number | undefined

  if (product.enableVariants && product?.variants?.docs?.length) {
    price = product?.variants?.docs?.reduce((acc, variant) => {
      if (typeof variant === 'object' && variant?.priceInINR && acc && variant?.priceInINR > acc) {
        return variant.priceInINR
      }
      return acc
    }, price)

    const variantPrices = product.variants.docs
      .map((variant) => (typeof variant === 'object' ? variant.priceInINR : undefined))
      .filter((value): value is number => typeof value === 'number')

    if (variantPrices.length) {
      lowPrice = Math.min(...variantPrices)
      highPrice = Math.max(...variantPrices)
    }
  }

  const productUrl = `${getServerSideURL()}/products/${product.slug}`

  const payloadForReviews = await getPayload({ config: configPromise })
  const { docs: approvedReviews } = await payloadForReviews.find({
    collection: 'reviews',
    depth: 0,
    limit: 200,
    overrideAccess: false,
    select: { rating: true },
    where: { and: [{ product: { equals: product.id } }, { status: { equals: 'approved' } }] },
  })
  const reviewCount = approvedReviews.length
  const averageRating = reviewCount
    ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0

  const productJsonLd = buildProductJsonLd({
    description: richTextToPlainText(product.description),
    hasStock: Boolean(hasStock),
    imageUrl: metaImage?.url,
    price,
    lowPrice,
    highPrice,
    title: product.title,
    url: productUrl,
    averageRating,
    reviewCount,
    brand: typeof product.brand === 'object' ? product.brand?.title : undefined,
    sku: product.sku,
  })

  const firstCategory = product.categories?.find(
    (category): category is Category => typeof category === 'object',
  )

  const breadcrumb = firstCategory
    ? [
        ...(await getCategoryBreadcrumb(await getPayload({ config: configPromise }), firstCategory)),
        { name: product.title, url: productUrl },
      ]
    : undefined

  const relatedProducts =
    product.relatedProducts?.filter((relatedProduct) => typeof relatedProduct === 'object') ?? []

  const compatibleProducts =
    product.compatibleProducts?.filter((compatibleProduct) => typeof compatibleProduct === 'object') ?? []

  const siteSettings = await getCachedGlobal('site-settings', 0)()

  const companions = await getAlsoBoughtProducts({ payload: payloadForReviews, productId: product.id, limit: 2 })

  return (
    <React.Fragment>
      <JsonLd data={productJsonLd} />
      {breadcrumb && <JsonLd data={buildBreadcrumbListJsonLd(breadcrumb)} />}
      <TrackProductView
        productId={product.id}
        productTitle={product.title}
        productSlug={product.slug!}
        price={price}
      />
      <TrackRecentlyViewed productId={String(product.id)} />
      <div className="container pt-6 pb-24 lg:pb-8">
        {breadcrumb && (
          <Breadcrumb className="mb-5">
            <BreadcrumbList>
              {breadcrumb.map((item, index) => (
                <React.Fragment key={item.url}>
                  {index > 0 && <li className="text-border">/</li>}
                  <BreadcrumbItem>
                    {index === breadcrumb.length - 1 ? (
                      <BreadcrumbPage className="line-clamp-1">{item.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={new URL(item.url).pathname}>{item.name}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <div className="border-border/70 bg-card flex flex-col gap-12 rounded-3xl border p-8 md:py-12 lg:flex-row lg:gap-14">
          <div className="h-full w-full basis-full lg:basis-1/2">
            <Suspense
              fallback={
                <div className="bg-muted/30 relative aspect-square h-full w-full animate-pulse overflow-hidden rounded-2xl" />
              }
            >
              {gallery?.length ? (
                <Gallery categorySlug={firstCategory?.slug} gallery={gallery} product={product} />
              ) : (
                <ProductImagePlaceholder categorySlug={firstCategory?.slug} />
              )}
            </Suspense>
          </div>

          <div className="basis-full lg:basis-1/2">
            <ProductDescription
              averageRating={averageRating}
              categoryName={firstCategory?.title}
              categorySlug={firstCategory?.slug}
              product={product}
              reviewCount={reviewCount}
              supportEmail={siteSettings?.supportEmail}
            />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-14">
          <SpecTable product={product} />
          <PriceTiers product={product} />
          <Datasheets product={product} />
          <ProductFaqs product={product} />
          {companions.length > 0 && <FrequentlyBoughtTogether companions={companions} mainProduct={product} />}
          <div id="reviews">
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </div>

      {product.layout?.length ? <RenderBlocks blocks={product.layout} /> : <></>}

      {relatedProducts.length ? (
        <div className="container">
          <RelatedProducts heading="Related Products" products={relatedProducts as Product[]} />
        </div>
      ) : (
        <></>
      )}

      {compatibleProducts.length ? (
        <div className="container">
          <RelatedProducts heading="Compatible Products" products={compatibleProducts as Product[]} />
        </div>
      ) : (
        <></>
      )}

      <RecentlyViewedProducts excludeProductId={String(product.id)} />
    </React.Fragment>
  )
}

function ProductImagePlaceholder({ categorySlug }: { categorySlug?: string | null }) {
  const CategoryIcon = getCategoryIcon(categorySlug)

  return (
    <div className="border-border bg-muted/20 relative flex aspect-square w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border">
      <CategoryIcon className="text-muted-foreground/50 size-28" />
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <ImageOffIcon className="size-3.5" />
        Photo coming soon
      </div>
    </div>
  )
}

function RelatedProducts({ heading, products }: { heading: string; products: Product[] }) {
  if (!products.length) return null

  return (
    <div className="py-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">{heading}</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {products.map((product) => (
          <li
            className="w-[70%] flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
            key={product.id}
          >
            <ProductGridItem product={product} />
          </li>
        ))}
      </ul>
    </div>
  )
}

const queryProductBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 3,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    populate: {
      variants: {
        title: true,
        priceInINR: true,
        inventory: true,
        options: true,
      },
    },
  })

  return result.docs?.[0] || null
}
