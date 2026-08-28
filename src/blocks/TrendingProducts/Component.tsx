import type { TrendingProductsBlock as TrendingProductsBlockProps } from '@/payload-types'

import { DealProductCard } from '@/components/product/DealProductCard'
import { getAverageRatings } from '@/lib/getAverageRatings'
import { getTrendingProducts } from '@/lib/getTrendingProducts'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'

import { MobileTrendingProducts } from './MobileTrendingProducts'

export const TrendingProductsBlock: React.FC<
  TrendingProductsBlockProps & {
    id?: string | number
  }
> = ({ heading, pinnedProducts, limit }) => {
  const resolvedLimit = limit || 8

  return (
    <div className="container">
      {heading && <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{heading}</h2>}
      <Suspense fallback={<TrendingProductsSkeleton limit={resolvedLimit} />}>
        <TrendingProductsContent limit={resolvedLimit} pinnedProducts={pinnedProducts} />
      </Suspense>
    </div>
  )
}

const desktopGridClasses = 'hidden md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4'
const mobileSkeletonClasses = '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:hidden'
const itemClasses = 'w-[70%] shrink-0 snap-start md:w-auto'

const TrendingProductsContent: React.FC<{
  limit: number
  pinnedProducts: TrendingProductsBlockProps['pinnedProducts']
}> = async ({ limit, pinnedProducts }) => {
  const payload = await getPayload({ config: configPromise })
  const products = await getTrendingProducts({ payload, limit, pinnedProducts })

  if (products.length === 0) return null

  const ratings = await getAverageRatings(payload, products.map((product) => product.id))

  return (
    <>
      <div className={desktopGridClasses}>
        {products.map((product) => (
          <div className={itemClasses} key={product.id}>
            <DealProductCard
              averageRating={ratings.get(product.id)?.average}
              product={product}
              reviewCount={ratings.get(product.id)?.count}
            />
          </div>
        ))}
      </div>

      <MobileTrendingProducts products={products} ratings={ratings} />
    </>
  )
}

const TrendingProductsSkeleton: React.FC<{ limit: number }> = ({ limit }) => (
  <>
    <div className={desktopGridClasses}>
      {Array.from({ length: Math.min(limit, 8) }).map((_, index) => (
        <div className={`${itemClasses} bg-muted/60 aspect-square animate-shimmer rounded-2xl`} key={index} />
      ))}
    </div>
    <div className={mobileSkeletonClasses}>
      {Array.from({ length: Math.min(limit, 8) }).map((_, index) => (
        <div className={`${itemClasses} bg-muted/60 aspect-square animate-shimmer rounded-2xl`} key={index} />
      ))}
    </div>
  </>
)
