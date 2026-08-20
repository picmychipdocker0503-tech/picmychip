import type { HeroCarouselBlock as HeroCarouselBlockProps } from '@/payload-types'

import { PromoCard } from '@/components/PromoCard'
import { getTrendingProducts } from '@/lib/getTrendingProducts'
import configPromise from '@payload-config'
import { LockIcon, ShieldCheckIcon, TruckIcon } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'

import { HeroCarouselClient } from './Component.client'

const TRUST_ITEMS = [
  { Icon: ShieldCheckIcon, label: 'Genuine Components' },
  { Icon: TruckIcon, label: 'Fast Delivery' },
  { Icon: LockIcon, label: 'Secure Checkout' },
] as const

// The hero renders on every page load, but none of this needs to be
// second-by-second accurate: a stock count, a review average, and a 30-day
// trending pick all move slowly. Caching it turns the block from "wait on a
// products count + an unbounded reviews scan + a 500-order aggregation
// every render" into "usually already computed" — the skeleton fallback in
// RenderBlocks then only shows on a genuinely cold cache, not on every load.
const getHeroData = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })

    const [productCount, reviews, sideProductsRaw] = await Promise.all([
      payload.count({
        collection: 'products',
        where: { and: [{ _status: { equals: 'published' } }, { isGiftCard: { not_equals: true } }] },
      }),
      payload.find({
        collection: 'reviews',
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        select: { rating: true },
        where: { status: { equals: 'approved' } },
      }),
      // "TrendingNow" further down the page shows the top 8 trending products
      // (same ranking query, same out-of-stock filter) — fetching the same
      // top slice here would duplicate its first 2 cards, so this pulls the
      // *next* 2 (ranked #9-10) instead, guaranteed disjoint from that section.
      getTrendingProducts({ payload, limit: 24 }),
    ])

    return {
      productCount: productCount.totalDocs,
      reviewCount: reviews.totalDocs,
      reviewRatingSum: reviews.docs.reduce((sum, review) => sum + review.rating, 0),
      sideProductsRaw,
    }
  },
  ['hero-carousel-data'],
  { revalidate: 3600 },
)

export const HeroCarouselBlock: React.FC<
  HeroCarouselBlockProps & {
    id?: string | number
  }
> = async ({ slides }) => {
  if (!slides?.length) return null

  const { productCount, reviewCount, reviewRatingSum, sideProductsRaw } = await getHeroData()

  const sideProductPool = sideProductsRaw.filter((product) => product.stockStatus !== 'out-of-stock')
  const sideProducts = sideProductPool.slice(8, 10)

  const averageRating = reviewCount ? reviewRatingSum / reviewCount : 0

  // A raw low count ("1+ verified reviews") reads as thin rather than
  // honest, so it's reframed until there's enough volume to be credible.
  const reviewMessage =
    reviewCount === 0
      ? 'Be the first to review'
      : reviewCount < 20
        ? 'New store — verified components'
        : `${averageRating.toFixed(1)} · ${reviewCount}+ verified reviews`

  return (
    <section className="pmc-home-section">
      <div className={`grid grid-cols-1 gap-4${sideProducts.length > 0 ? ' lg:grid-cols-[1.6fr_1fr]' : ''}`}>
        <HeroCarouselClient slides={slides} stats={{ componentCount: productCount, reviewMessage }} />

        {sideProducts.length > 0 && (
          <div className="flex flex-col gap-4">
            {sideProducts.map((product) => {
              const image = product.gallery?.find((item) => typeof item.image === 'object')?.image
              const category =
                product.categories?.find((item) => typeof item === 'object') as
                  | { title?: string | null }
                  | undefined

              const variants = product.variants?.docs
              const firstVariant = variants && variants.length > 0 ? variants[0] : undefined
              const variantId = firstVariant && typeof firstVariant === 'object' ? firstVariant.id : undefined

              return (
                <PromoCard
                  className="min-h-[180px] flex-1"
                  disabled={product.stockStatus === 'out-of-stock'}
                  eyebrow={category?.title || 'Featured'}
                  heading={product.title}
                  href={product.slug ? `/products/${product.slug}` : null}
                  image={typeof image === 'object' ? image : undefined}
                  key={product.id}
                  productId={product.id}
                  tone="light"
                  variantId={variantId}
                />
              )
            })}
          </div>
        )}
      </div>

      <ul className="pmc-trust-strip">
        {TRUST_ITEMS.map(({ Icon, label }) => (
          <li className="pmc-trust-strip-item" key={label}>
            <div className="pmc-trust-strip-icon">
              <Icon className="size-4" />
            </div>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
