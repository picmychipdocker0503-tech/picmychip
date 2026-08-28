import { ScrollReveal } from '@/components/ScrollReveal'
import { DealProductCard } from '@/components/product/DealProductCard'
import { getAverageRatings } from '@/lib/getAverageRatings'
import { getTrendingProducts } from '@/lib/getTrendingProducts'
import configPromise from '@payload-config'
import { FlameIcon } from 'lucide-react'
import { getPayload } from 'payload'

import { MobileTrendingNow } from './MobileTrendingNow'

let devTrendingCache: Promise<Awaited<ReturnType<typeof loadTrendingNowData>>> | undefined

async function loadTrendingNowData() {
  const payload = await getPayload({ config: configPromise })
  const isDevelopment = process.env.NODE_ENV !== 'production'
  // Gift cards are already excluded inside getTrendingProducts. Over-fetch
  // and filter out-of-stock locally rather than pushing that into the
  // shared query — an out-of-stock item defeats the point of a "buy this"
  // section here, but the CMS-configurable trending block should still be
  // free to show one if a merchandiser pins it deliberately.
  let candidates: Awaited<ReturnType<typeof getTrendingProducts>> = []
  try {
    candidates = await getTrendingProducts({ payload, limit: isDevelopment ? 8 : 24 })
  } catch (error) {
    payload.logger.warn({ err: error }, 'Unable to load trending products; hiding Trending Now section.')
  }

  const products = candidates.filter((product) => product.stockStatus !== 'out-of-stock').slice(0, isDevelopment ? 4 : 8)

  const ratings = isDevelopment
    ? new Map()
    : await getAverageRatings(
        payload,
        products.map((product) => product.id),
      )

  return { products, ratings }
}

export const TrendingNow: React.FC = async () => {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const { products, ratings } = await (isDevelopment
    ? (devTrendingCache ??= loadTrendingNowData())
    : loadTrendingNowData())

  if (products.length === 0) return null

  return (
    <div className="container my-10 sm:my-20">
      <span className="eyebrow inline-flex items-center gap-1.5">
        <FlameIcon className="size-3.5" />
        Trending Now
      </span>
      <h2 className="mt-2 mb-5 sm:mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
        Best Sellers This Month
      </h2>
      {/* Desktop/tablet */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-4">
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

      {/* Mobile — its own horizontal snap-scroll row instead of a squeezed
          2-column grid */}
      <MobileTrendingNow products={products} ratings={ratings} />
    </div>
  )
}
