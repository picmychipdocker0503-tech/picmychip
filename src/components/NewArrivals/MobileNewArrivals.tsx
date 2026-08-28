import type { Product } from '@/payload-types'

import type { RatingInfo } from '@/lib/getAverageRatings'

import { MobileDealProductCard } from '@/components/product/MobileDealProductCard'

type Props = {
  products: Product[]
  ratings: Map<number, RatingInfo>
}

/**
 * Mobile's own "New Arrivals" row — a horizontal snap-scroll carousel (same
 * pattern as the CMS TrendingProducts block and MobileTrendingNow) instead
 * of the desktop grid squeezed into 2 columns.
 */
export function MobileNewArrivals({ products, ratings }: Props) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:hidden">
      {products.map((product) => (
        <div className="w-[70%] shrink-0 snap-start" key={product.id}>
          <MobileDealProductCard
            averageRating={ratings.get(product.id)?.average}
            product={product}
            reviewCount={ratings.get(product.id)?.count}
          />
        </div>
      ))}
    </div>
  )
}
