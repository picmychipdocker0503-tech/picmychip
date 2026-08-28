import configPromise from '@payload-config'
import { ArrowRight, Layers } from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'

import { EmptyState } from '@/components/illustrations'
import { CATEGORY_ICON_MAP } from '@/components/illustrations/categoryIcons'
import { ScrollReveal } from '@/components/ScrollReveal'

import { CATEGORY_ACCENTS, DEFAULT_ACCENT } from './categoryAccents'
import { MobileFeaturedCategories } from './MobileFeaturedCategories'

const FEATURED_CATEGORY_SLUGS = [
  'resistor',
  'connectors',
  'drone-parts',
  'capacitor',
  'diode',
  'usb-cables',
  'inductor',
  'ic',
]

export async function FeaturedCategories() {
  const payload = await getPayload({ config: configPromise })

  const [{ docs }, productCount] = await Promise.all([
    payload.find({
      collection: 'categories',
      where: { slug: { in: FEATURED_CATEGORY_SLUGS } },
      limit: FEATURED_CATEGORY_SLUGS.length,
      depth: 0,
    }),
    payload.count({
      collection: 'products',
      where: { and: [{ _status: { equals: 'published' } }, { isGiftCard: { not_equals: true } }] },
    }),
  ])

  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))
  const categories = FEATURED_CATEGORY_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (doc): doc is NonNullable<typeof doc> => Boolean(doc),
  )

  if (categories.length === 0) return null

  // Rounded down to the nearest 10 so the count doesn't need updating on
  // every single product add/remove (e.g. 232 published -> "230+ Parts").
  const roundedPartsCount = Math.floor(productCount.totalDocs / 10) * 10

  return (
    <section className="container mb-10 sm:mb-20">
      <div className="mb-6 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20 mb-3">
            <Layers className="size-3.5" />
            BROWSE HARDWARE ECOSYSTEM
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
            Shop by Component Category
          </h2>
          <p className="mt-2 max-w-lg text-sm sm:text-base text-muted-foreground">
            Precision SMD passives, discrete silicon, connectors, and dev boards with verified datasheets.
          </p>
        </div>
        <Link
          href="/shop"
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <span>View All {roundedPartsCount.toLocaleString('en-IN')}+ Parts</span>
          <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Desktop/tablet — bordered cards in a grid */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-6">
        {categories.map((category, index) => {
          const Icon = CATEGORY_ICON_MAP[category.slug] ?? EmptyState
          const accent = CATEGORY_ACCENTS[category.slug] ?? DEFAULT_ACCENT

          return (
            <ScrollReveal index={index} key={category.id} staggerMs={50}>
              <Link
                href={`/category/${category.slug}`}
                className="group border-border/80 bg-card/60 hover:border-primary/50 hover:bg-card relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border px-6 py-8 text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:scale-110 ${accent.icon} ${accent.bg} ${accent.border} ${accent.hoverBg} ${accent.hoverBorder}`}
                >
                  <Icon className="size-7" />
                </div>

                <div>
                  <span className="text-foreground group-hover:text-primary block text-base font-semibold transition-colors">
                    {category.title}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-[11px] font-medium">
                    Datasheet Verified
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          )
        })}
      </div>

      {/* Mobile — its own component, not just this grid squeezed smaller */}
      <MobileFeaturedCategories categories={categories} />
    </section>
  )
}
