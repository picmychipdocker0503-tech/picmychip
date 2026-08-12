import { DealProductCard } from '@/components/product/DealProductCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { getAverageRatings } from '@/lib/getAverageRatings'
import { getTrendingProducts } from '@/lib/getTrendingProducts'
import configPromise from '@payload-config'
import { FlameIcon } from 'lucide-react'
import { getPayload } from 'payload'

export const TrendingNow: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })
  // Gift cards are already excluded inside getTrendingProducts. Over-fetch
  // and filter out-of-stock locally rather than pushing that into the
  // shared query — an out-of-stock item defeats the point of a "buy this"
  // section here, but the CMS-configurable trending block should still be
  // free to show one if a merchandiser pins it deliberately.
  const candidates = await getTrendingProducts({ payload, limit: 24 })
  const products = candidates.filter((product) => product.stockStatus !== 'out-of-stock').slice(0, 8)

  if (products.length === 0) return null

  const ratings = await getAverageRatings(
    payload,
    products.map((product) => product.id),
  )

  return (
    <div className="container my-20">
      <span className="eyebrow inline-flex items-center gap-1.5">
        <FlameIcon className="size-3.5" />
        Trending Now
      </span>
      <h2 className="mt-2 mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        Best Sellers This Month
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.map((product, index) => (
          <ScrollReveal className="h-full" index={index} key={product.id} staggerMs={50}>
            <DealProductCard
              averageRating={ratings.get(product.id)?.average}
              product={product}
              reviewCount={ratings.get(product.id)?.count}
            />
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}
