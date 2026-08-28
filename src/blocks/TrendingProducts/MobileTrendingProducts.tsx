import type { Product } from '@/payload-types'

import type { RatingInfo } from '@/lib/getAverageRatings'

import { MobileDealProductCard } from '@/components/product/MobileDealProductCard'

type Props = {
  products: Product[]
  ratings: Map<number, RatingInfo>
}

/**
 * Mobile's own "Featured Products" row — a horizontal snap-scroll carousel,
 * kept as its own component (rather than one className string shared with
 * the desktop grid) so it can be tuned independently and doesn't switch
 * breakpoints at `sm:` (640px) while every other mobile split in this app
 * switches at `md:` (768px).
 */
export function MobileTrendingProducts({ products, ratings }: Props) {
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
