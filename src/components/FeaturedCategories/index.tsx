import configPromise from '@payload-config'
import { ArrowRight, Layers } from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'

import { EmptyState } from '@/components/illustrations'
import { CATEGORY_ICON_MAP } from '@/components/illustrations/categoryIcons'
import { ScrollReveal } from '@/components/ScrollReveal'

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

// Each category gets its own accent instead of one uniform muted/primary
// tint, so the grid reads as a color-coded parts index at a glance.
const CATEGORY_ACCENTS: Record<string, { icon: string; bg: string; border: string; hoverBg: string; hoverBorder: string }> = {
  resistor: {
    icon: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    hoverBg: 'group-hover:bg-amber-500/20',
    hoverBorder: 'group-hover:border-amber-500/50',
  },
  connectors: {
    icon: 'text-slate-600',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/25',
    hoverBg: 'group-hover:bg-slate-500/20',
    hoverBorder: 'group-hover:border-slate-500/50',
  },
  'drone-parts': {
    icon: 'text-sky-600',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/25',
    hoverBg: 'group-hover:bg-sky-500/20',
    hoverBorder: 'group-hover:border-sky-500/50',
  },
  capacitor: {
    icon: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    hoverBg: 'group-hover:bg-blue-500/20',
    hoverBorder: 'group-hover:border-blue-500/50',
  },
  diode: {
    icon: 'text-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    hoverBg: 'group-hover:bg-red-500/20',
    hoverBorder: 'group-hover:border-red-500/50',
  },
  'usb-cables': {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    hoverBg: 'group-hover:bg-emerald-500/20',
    hoverBorder: 'group-hover:border-emerald-500/50',
  },
  inductor: {
    icon: 'text-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    hoverBg: 'group-hover:bg-orange-500/20',
    hoverBorder: 'group-hover:border-orange-500/50',
  },
  ic: {
    icon: 'text-violet-600',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    hoverBg: 'group-hover:bg-violet-500/20',
    hoverBorder: 'group-hover:border-violet-500/50',
  },
}

const DEFAULT_ACCENT = {
  icon: 'text-primary',
  bg: 'bg-primary/10',
  border: 'border-primary/25',
  hoverBg: 'group-hover:bg-primary/20',
  hoverBorder: 'group-hover:border-primary/50',
}

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

      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {categories.map((category, index) => {
          const Icon = CATEGORY_ICON_MAP[category.slug] ?? EmptyState
          const accent = CATEGORY_ACCENTS[category.slug] ?? DEFAULT_ACCENT

          return (
            <ScrollReveal index={index} key={category.id} staggerMs={50}>
              <Link
                href={`/category/${category.slug}`}
                className="group relative flex flex-col items-center gap-2 sm:gap-4 rounded-3xl border border-transparent px-1 py-2 text-center transition-all duration-300 sm:border-border/80 sm:bg-card/60 sm:px-6 sm:py-8 sm:backdrop-blur-md sm:hover:-translate-y-1 sm:hover:border-primary/50 sm:hover:bg-card sm:hover:shadow-lg overflow-hidden"
              >
                <div
                  className={`flex size-14 shrink-0 items-center justify-center rounded-full border transition-all duration-300 sm:size-14 sm:rounded-2xl sm:shadow-sm sm:group-hover:scale-110 ${accent.icon} ${accent.bg} ${accent.border} ${accent.hoverBg} ${accent.hoverBorder}`}
                >
                  <Icon className="size-6 sm:size-7" />
                </div>

                <div>
                  <span className="text-xs sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors block">
                    {category.title}
                  </span>
                  <span className="mt-1 hidden sm:block text-[11px] font-medium text-muted-foreground">
                    Datasheet Verified
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          )
        })}
      </div>
    </section>
  )
}
