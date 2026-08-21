import type { Media as MediaType, Product } from '@/payload-types'
import type { Metadata } from 'next'

import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import configPromise from '@payload-config'
import {
    ArrowRightIcon,
    BadgeCheckIcon,
    CircuitBoardIcon,
    ClipboardCheckIcon,
    CpuIcon,
    DrillIcon,
    Layers3Icon,
    PackageSearchIcon,
    RadioTowerIcon,
    RulerIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TimerIcon,
    TruckIcon,
    WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'

export const metadata: Metadata = {
  description:
    'Plan robotics, IoT, drone, and prototyping builds with curated parts, workflow guidance, and Picmychip services.',
  title: 'Maker Studio | Picmychip',
}

const projectTracks = [
  {
    title: 'IoT prototype',
    text: 'Microcontroller, sensors, jumper kits, cases, cables, and power packed around fast iteration.',
    icon: RadioTowerIcon,
  },
  {
    title: 'Drone rebuild',
    text: 'Motors, ESCs, connectors, fastening hardware, and spares grouped for repair benches.',
    icon: CircuitBoardIcon,
  },
  {
    title: 'Workshop refresh',
    text: 'Measurement, soldering, hand tools, consumables, and storage essentials for daily use.',
    icon: DrillIcon,
  },
]

const serviceLanes = [
  { label: 'Component matching', icon: PackageSearchIcon },
  { label: 'Bulk quote support', icon: ClipboardCheckIcon },
  { label: 'Fast dispatch', icon: TruckIcon },
  { label: 'Spec confidence', icon: ShieldCheckIcon },
]

const checklist = [
  'Power budget checked',
  'Connectors confirmed',
  'Mounting dimensions reviewed',
  'Datasheets saved',
  'Spare quantities added',
  'Shipping window selected',
]

const bundles = [
  'Robotics starter cart',
  'Sensor expansion kit',
  'Drone service pack',
  'Bench repair stack',
]
const assetDomain = (process.env.NEXT_PUBLIC_ASSET_DOMAIN || 'https://assets.picmychip.in').replace(/\/$/, '')

async function getStudioProducts() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 12,
    pagination: false,
    sort: '-createdAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs.filter((product) => !isGiftCard(product)).slice(0, 3)
}

function getProductImage(product?: Product): MediaType | undefined {
  const image = product?.gallery?.[0]?.image
  if (!image || typeof image !== 'object' || !image.filename) return undefined

  return {
    ...image,
    url: image.url || `${assetDomain}/media/${image.filename}`,
  }
}

function isGiftCard(product: Product) {
  return product.title.toLowerCase().includes('gift card')
}

function formatPrice(product: Product) {
  const price = product.priceInINR

  if (typeof price !== 'number' || price <= 0) return 'Quote'

  // Stored in paise (smallest currency unit) — divide by 100 before
  // formatting, same convention as `useCurrency().formatCurrency`.
  return new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(price / 100)
}

export default async function MakerStudioPage() {
  const products = await getStudioProducts()
  const heroProduct = products.find((product) => getProductImage(product)) ?? products[0]
  const heroImage = getProductImage(heroProduct)

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[linear-gradient(135deg,oklch(96%_0.03_195deg),oklch(100%_0_0deg)_48%,oklch(96%_0.035_85deg))]">
        <div className="container grid gap-10 py-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:py-18">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-background/85 px-3 py-2 text-sm font-medium text-primary shadow-sm">
              <SparklesIcon className="size-4" />
              Maker Studio
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] text-foreground sm:text-6xl">
              Plan a cleaner cart before the build begins.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Use this inside page to guide shoppers from a project goal to the right boards,
              connectors, power, tools, and spares.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 px-6 text-base">
                <Link href="/shop">
                  Build a cart <ArrowRightIcon className="size-5" />
                </Link>
              </Button>
              <Button asChild className="h-12 px-6 text-base" variant="outline">
                <Link href="/services/custom-cable-assembly">
                  See services <WrenchIcon className="size-5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(14rem,16rem)]">
              <div className="relative aspect-[4/3] bg-muted">
                {heroImage ? (
                  <Media
                    fill
                    imgClassName="object-cover"
                    priority
                    resource={heroImage}
                    size="(min-width: 1024px) 48vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <CpuIcon className="size-24 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-col justify-between gap-8 border-t border-border p-5 md:border-l md:border-t-0">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Studio pick
                  </p>
                  <h2 className="mt-3 line-clamp-3 break-words text-2xl font-semibold leading-tight">
                    {heroProduct?.title ?? 'Prototype-ready essentials'}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    A visual detail panel gives the inner page a proper product-led story.
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {heroProduct ? formatPrice(heroProduct) : 'Browse'}
                  </div>
                  <Button asChild className="mt-4 w-full" variant="secondary">
                    <Link href={heroProduct?.slug ? `/products/${heroProduct.slug}` : '/shop'}>
                      View details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Project tracks
              </p>
              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Choose the build lane</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/compare">
                Compare parts <Layers3Icon className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {projectTracks.map(({ icon: Icon, text, title }) => (
              <article className="rounded-lg border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg" key={title}>
                <Icon className="size-8 text-primary" />
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 py-14">
        <div className="container grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Guided workflow
            </p>
            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
              Give shoppers confidence at every step
            </h2>
            <p className="mt-4 leading-8 text-muted-foreground">
              The inside page breaks the journey into practical checks, not marketing fluff. It feels
              useful whether someone is buying one sensor or planning a lab restock.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {checklist.map((item) => (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4" key={item}>
                <BadgeCheckIcon className="size-5 text-primary" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                  Bundle ideas
                </p>
                <h2 className="mt-2 text-3xl font-semibold">Cart starters</h2>
              </div>
              <RulerIcon className="size-8 text-primary" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {bundles.map((bundle) => (
                <Link
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-4 font-medium transition hover:border-primary/40"
                  href="/shop"
                  key={bundle}
                >
                  {bundle}
                  <ArrowRightIcon className="size-4 text-primary" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-foreground p-6 text-background">
            <TimerIcon className="size-8 text-orange" />
            <h2 className="mt-6 text-3xl font-semibold">Shorten the parts hunt.</h2>
            <p className="mt-3 leading-7 text-background/75">
              Strong inner pages help users decide where to go next, while the product catalog stays
              one click away.
            </p>
            <div className="mt-6 grid gap-3">
              {serviceLanes.map(({ icon: Icon, label }) => (
                <div className="flex items-center gap-3 rounded-lg bg-background/10 p-3" key={label}>
                  <Icon className="size-5 text-orange" />
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {products.length > 0 ? (
        <section className="pb-16">
          <div className="container">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Recently stocked
              </p>
              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Useful additions</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {products.map((product) => {
                const image = getProductImage(product)

                return (
                  <Link
                    className="group rounded-lg border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-lg"
                    href={`/products/${product.slug}`}
                    key={product.id}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                      {image ? (
                        <Media
                          fill
                          imgClassName="object-cover transition group-hover:scale-105"
                          resource={image}
                          size="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <CpuIcon className="size-12 text-primary" />
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 line-clamp-2 font-semibold group-hover:text-primary">{product.title}</h3>
                    <div className="mt-2 text-lg font-bold text-primary">{formatPrice(product)}</div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
