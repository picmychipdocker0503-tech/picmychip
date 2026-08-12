import type { Media as MediaType } from '@/payload-types'
import type { HeroCarouselBlock as HeroCarouselBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import { ServiceQuickLinks } from '@/components/services/ServiceQuickLinks'
import { getCategoryIcon } from '@/components/illustrations/categoryIcons'
import { getTrendingProducts } from '@/lib/getTrendingProducts'
import { getCategoryTreeSafe } from '@/utilities/getCategoryTree'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSocialIcon } from '@/utilities/getSocialIcon'
import configPromise from '@payload-config'
import { ArrowUpRightIcon, StarIcon } from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'

import { HeroCarouselClient } from './Component.client'

export const HeroCarouselBlock: React.FC<
  HeroCarouselBlockProps & {
    id?: string | number
  }
> = async ({ slides }) => {
  if (!slides?.length) return null

  const payload = await getPayload({ config: configPromise })

  const [categoryTree, trending, productCount, siteSettings, reviews] = await Promise.all([
    getCategoryTreeSafe(payload),
    getTrendingProducts({ payload, limit: 3 }),
    payload.count({
      collection: 'products',
      where: { and: [{ _status: { equals: 'published' } }, { isGiftCard: { not_equals: true } }] },
    }),
    getCachedGlobal('site-settings', 1)(),
    payload.find({
      collection: 'reviews',
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
      select: { rating: true },
      where: { status: { equals: 'approved' } },
    }),
  ])

  const socialLinks = siteSettings?.sameAs ?? []
  const popularCategories = categoryTree.topLevel.slice(0, 6)
  const [teaserProduct, tallProduct, bottomProduct] = trending

  const reviewCount = reviews.totalDocs
  const averageRating = reviewCount
    ? reviews.docs.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0

  return (
    <section className="pmc-home-section">
      {/* Services */}

      <div className="pmc-services-container">
        <Suspense fallback={null}>
          <ServiceQuickLinks className="pmc-service-links" />
        </Suspense>
      </div>

      {/* Hero */}

      <div className="pmc-hero-container">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          <HeroCarouselClient slides={slides} socialLinks={socialLinks} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {popularCategories.length > 0 && (
              <BentoCard className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Popular Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularCategories.map((category) => {
                    const Icon = getCategoryIcon(category.slug)
                    return (
                      <Link
                        aria-label={category.title}
                        className="border-border bg-background hover:border-primary/40 hover:bg-primary/5 group flex size-11 items-center justify-center rounded-full border transition-colors"
                        href={`/category/${category.slug}`}
                        key={category.id}
                        title={category.title}
                      >
                        <Icon className="text-foreground/70 group-hover:text-primary size-6 transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              </BentoCard>
            )}

            {teaserProduct && (
              <ProductTeaserCard label="New In" product={teaserProduct} />
            )}

            {tallProduct && <TallProductCard product={tallProduct} />}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BentoCard className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {trending.slice(0, 3).map((product) => {
                const image = product.gallery?.find((item) => typeof item.image === 'object')?.image as
                  | MediaType
                  | undefined
                return (
                  <div
                    className="border-card bg-muted relative size-11 overflow-hidden rounded-full border-2"
                    key={product.id}
                  >
                    {image && <Media className="relative h-full w-full" fill imgClassName="object-cover" resource={image} />}
                  </div>
                )
              })}
            </div>
            <div>
              <div className="text-foreground text-lg font-bold">{productCount.totalDocs}+</div>
              <div className="text-muted-foreground text-xs">Components in stock</div>
            </div>
          </BentoCard>

          <BentoCard className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
              <StarIcon className="size-5 fill-current" />
            </div>
            <div>
              <div className="text-foreground text-lg font-bold">
                {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
              </div>
              <div className="text-muted-foreground text-xs">
                {reviewCount > 0 ? `${reviewCount}+ verified reviews` : 'Be the first to review'}
              </div>
            </div>
          </BentoCard>

          {bottomProduct ? (
            <PopularProductCard product={bottomProduct} />
          ) : (
            <BentoCard className="flex items-center justify-center">
              <span className="text-muted-foreground text-sm">More arriving soon</span>
            </BentoCard>
          )}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Shared bento primitives                                                    */
/* -------------------------------------------------------------------------- */

const BentoCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`border-border bg-card rounded-2xl border p-4 ${className ?? ''}`}>{children}</div>
)

const productImage = (product: { gallery?: { image: unknown }[] | null }) => {
  const image = product.gallery?.find((item) => typeof item.image === 'object')?.image
  return typeof image === 'object' ? (image as MediaType) : undefined
}

const ProductTeaserCard: React.FC<{
  label: string
  product: { id: number; slug?: string | null; title: string; gallery?: { image: unknown }[] | null }
}> = ({ label, product }) => {
  const image = productImage(product)

  return (
    <Link
      className="border-border bg-card hover:border-primary/40 group flex flex-col gap-2 rounded-2xl border p-4 transition-colors"
      href={`/products/${product.slug}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{label}</span>
        <ArrowUpRightIcon className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-xl">
          {image && <Media className="relative h-full w-full" fill imgClassName="object-contain p-1.5" resource={image} />}
        </div>
        <div className="min-w-0">
          <div className="text-foreground line-clamp-2 text-sm font-semibold">{product.title}</div>
        </div>
      </div>
    </Link>
  )
}

const TallProductCard: React.FC<{
  product: { id: number; slug?: string | null; title: string; gallery?: { image: unknown }[] | null }
}> = ({ product }) => {
  const image = productImage(product)

  return (
    <Link
      className="group bg-muted relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl sm:col-span-2 lg:col-span-1"
      href={`/products/${product.slug}`}
    >
      {image && (
        <Media
          className="absolute inset-0"
          fill
          imgClassName="object-cover transition-transform duration-300 group-hover:scale-105"
          resource={image}
        />
      )}
      <div className="from-background/95 via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />
      <div className="border-border bg-card/90 text-foreground absolute top-3 right-3 flex size-8 items-center justify-center rounded-full border backdrop-blur-sm">
        <ArrowUpRightIcon className="size-4" />
      </div>
      <div className="relative p-4">
        <div className="text-foreground line-clamp-2 text-sm font-semibold">{product.title}</div>
        <div className="text-muted-foreground mt-0.5 text-xs">Trending this week</div>
      </div>
    </Link>
  )
}

const PopularProductCard: React.FC<{
  product: { id: number; slug?: string | null; title: string; gallery?: { image: unknown }[] | null }
}> = ({ product }) => {
  const image = productImage(product)

  return (
    <Link
      className="border-border bg-card hover:border-primary/40 group flex items-center gap-3 rounded-2xl border p-4 transition-colors"
      href={`/products/${product.slug}`}
    >
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-xl">
        {image && <Media className="relative h-full w-full" fill imgClassName="object-contain p-1.5" resource={image} />}
      </div>
      <div className="min-w-0 flex-1">
        <span className="bg-primary/10 text-primary mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
          Popular
        </span>
        <div className="text-foreground line-clamp-2 text-sm font-semibold">{product.title}</div>
      </div>
      <ArrowUpRightIcon className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors" />
    </Link>
  )
}
