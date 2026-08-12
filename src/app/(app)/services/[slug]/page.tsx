import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { getServiceIcon } from '@/lib/getServiceIcon'
import { getServerSideURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
import { ArrowLeftIcon } from 'lucide-react'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export default async function ServicePage({ params }: Args) {
  const { slug } = await params
  const service = await queryServiceBySlug({ slug })

  if (!service) return notFound()

  const Icon = getServiceIcon(service.title)
  const otherServices = await queryOtherServices(slug)

  return (
    <div className="pt-16 pb-24">
      <div className="container max-w-2xl">
        <Link
          className="text-muted-foreground hover:text-primary mb-8 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          href="/services"
        >
          <ArrowLeftIcon className="size-3.5" />
          All services
        </Link>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="from-orange/25 to-orange/10 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br">
            <Icon className="text-orange size-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{service.title}</h1>
          {service.description && <p className="text-muted-foreground max-w-lg">{service.description}</p>}
        </div>

        <div className="border-border bg-card mt-10 flex flex-col items-center gap-5 rounded-2xl border p-8 text-center">
          {service.body && <p className="text-foreground whitespace-pre-line">{service.body}</p>}
          <div className="flex flex-col items-center gap-2">
            <Button asChild size="lg">
              <Link href="/contact">Get a Quote</Link>
            </Button>
            <p className="text-muted-foreground text-xs">
              No instant configurator yet — tell us what you need and we&apos;ll follow up with pricing and
              turnaround.
            </p>
          </div>
        </div>
      </div>

      {otherServices.length > 0 && (
        <div className="container mt-16 max-w-2xl">
          <h2 className="text-foreground mb-4 text-sm font-semibold tracking-wide uppercase">Other services</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {otherServices.map((other) => {
              const OtherIcon = getServiceIcon(other.title)
              return (
                <Link
                  className="card-hover border-border bg-card group flex flex-col items-center gap-2 rounded-xl border p-4 text-center"
                  href={`/services/${other.slug}`}
                  key={other.id}
                >
                  <OtherIcon className="text-orange size-5" />
                  <span className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
                    {other.title}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const service = await queryServiceBySlug({ slug })

  if (!service) return {}

  return {
    alternates: {
      canonical: `${getServerSideURL()}/services/${slug}`,
    },
    description: service.description || undefined,
    title: service.title,
  }
}

const queryServiceBySlug = async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'services',
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
}

const queryOtherServices = async (currentSlug: string) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'services',
    limit: 3,
    sort: 'title',
    where: {
      slug: {
        not_equals: currentSlug,
      },
    },
  })

  return result.docs
}
