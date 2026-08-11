import type { Service, ServicesShowcaseBlock as ServicesShowcaseBlockProps } from '@/payload-types'

import { getServiceIcon } from '@/lib/getServiceIcon'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

export const ServicesShowcaseBlock: React.FC<
  ServicesShowcaseBlockProps & {
    id?: string | number
  }
> = ({ heading, services }) => {
  const resolvedServices = (services ?? []).filter((service): service is Service => typeof service === 'object')

  if (resolvedServices.length === 0) return null

  return (
    <div className="container">
      {heading && <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{heading}</h2>}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {resolvedServices.map((service) => {
          const Icon = getServiceIcon(service.title)

          return (
            <div
              className="card-hover border-border bg-card flex items-center justify-between gap-4 rounded-2xl border p-6"
              key={service.id}
            >
              <div className="flex flex-col items-start gap-3">
                <h3 className="text-lg font-semibold">{service.title}</h3>
                {service.description && <p className="text-muted-foreground text-sm">{service.description}</p>}
                <Button asChild size="sm">
                  <Link href={`/services/${service.slug}`}>Order Now</Link>
                </Button>
              </div>
              <div className="from-orange/25 to-orange/10 flex size-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br">
                <Icon className="text-orange size-10" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
