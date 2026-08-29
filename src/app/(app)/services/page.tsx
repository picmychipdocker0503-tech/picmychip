import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { getServiceIcon } from '@/lib/getServiceIcon'
import { getServerSideURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
import { ArrowRightIcon, SparklesIcon } from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

export const metadata: Metadata = {
  alternates: {
    canonical: `${getServerSideURL()}/services`,
  },
  description:
    'Component sourcing, RFQ & BOM support, and fast, spec-verified dispatch from Picmychip.',
  title: 'Services — Picmychip',
}

export default async function ServicesPage() {
  const payload = await getPayload({ config: configPromise })
  const { docs: services } = await payload.find({
    collection: 'services',
    limit: 50,
    sort: 'title',
  })

  return (
    <div className="pt-16 pb-24">
      <div className="container mb-14 flex flex-col items-center gap-3 text-center">
        <span className="eyebrow inline-flex items-center gap-1.5">
          <SparklesIcon className="size-3.5" />
          Services
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How We Help You Source Parts</h1>
        <p className="text-muted-foreground max-w-xl">
          From finding the right part to getting it into your hands fast — sourcing, RFQs, and spec verification,
          built around how makers and engineering teams actually work.
        </p>
      </div>

      {services.length > 0 ? (
        <div className="container">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {services.map((service) => {
              const Icon = getServiceIcon(service.title)

              return (
                <Link
                  className="card-hover border-border bg-card group flex flex-col gap-4 rounded-2xl border p-6"
                  href={`/services/${service.slug}`}
                  key={service.id}
                >
                  <div className="from-orange/25 to-orange/10 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br">
                    <Icon className="text-orange size-7" />
                  </div>
                  <div>
                    <h2 className="text-foreground group-hover:text-primary text-lg font-semibold transition-colors">
                      {service.title}
                    </h2>
                    {service.description && (
                      <p className="text-muted-foreground mt-1 text-sm">{service.description}</p>
                    )}
                  </div>
                  <span className="text-primary mt-auto inline-flex items-center gap-1 text-sm font-semibold">
                    View details
                    <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground container text-center">No services available right now.</p>
      )}

      <div className="container mt-14">
        <div className="border-border bg-card flex flex-col items-center gap-3 rounded-2xl border p-10 text-center">
          <h2 className="text-foreground text-xl font-semibold">Not sure what you need?</h2>
          <p className="text-muted-foreground max-w-md">
            Tell us about your project and we&apos;ll help you figure out the right process, material, and
            quantity.
          </p>
          <Button asChild>
            <Link href="/contact">Talk to us</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
