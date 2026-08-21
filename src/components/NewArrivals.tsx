import { DealProductCard } from '@/components/product/DealProductCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { getAverageRatings } from '@/lib/getAverageRatings'
import configPromise from '@payload-config'
import { SparklesIcon } from 'lucide-react'
import { getPayload } from 'payload'

let devNewArrivalsCache: Promise<Awaited<ReturnType<typeof loadNewArrivalsData>>> | undefined

async function loadNewArrivalsData() {
  const payload = await getPayload({ config: configPromise })
  const isDevelopment = process.env.NODE_ENV !== 'production'

  const { docs: products } = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: isDevelopment ? 4 : 8,
    overrideAccess: false,
    sort: '-createdAt',
    // Gift cards are a payment instrument, not a component — they'd
    // otherwise dominate "New Arrivals" since they're typically added last.
    // Out-of-stock items are excluded too — no point spotlighting something
    // that can't actually be bought.
    where: {
      and: [
        { _status: { equals: 'published' } },
        { isGiftCard: { not_equals: true } },
        { stockStatus: { not_equals: 'out-of-stock' } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      gallery: true,
      priceInINR: true,
      compareAtPriceInINR: true,
      salePriceInINR: true,
      onSale: true,
      saleEndDate: true,
      isClearance: true,
      stockStatus: true,
    },
  })

  if (products.length === 0) return { products: [], ratings: new Map() }

  const ratings = isDevelopment
    ? new Map()
    : await getAverageRatings(
        payload,
        products.map((product) => product.id),
      )

  return { products, ratings }
}

export const NewArrivals: React.FC = async () => {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const { products, ratings } = await (isDevelopment
    ? (devNewArrivalsCache ??= loadNewArrivalsData())
    : loadNewArrivalsData())

  if (products.length === 0) return null

  return (
    <div className="container my-20">
      <span className="eyebrow inline-flex items-center gap-1.5">
        <SparklesIcon className="size-3.5" />
        Just Landed
      </span>
      <h2 className="mt-2 mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
        New Arrivals
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
