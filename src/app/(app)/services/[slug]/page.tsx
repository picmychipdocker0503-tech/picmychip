import type { Metadata } from 'next'

import { Media } from '@/components/Media'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
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

  return (
    <div className="container flex flex-col items-center gap-6 py-16 text-center">
      {typeof service.icon === 'object' && service.icon?.url && (
        <div className="bg-primary/10 relative flex size-16 items-center justify-center overflow-hidden rounded-full">
          <Media fill imgClassName="object-contain p-3" resource={service.icon} />
        </div>
      )}
      <h1 className="text-3xl font-bold">{service.title}</h1>
      {service.description && <p className="text-muted-foreground max-w-xl">{service.description}</p>}
      {service.body && <p className="max-w-2xl whitespace-pre-line">{service.body}</p>}
      <p className="text-muted-foreground text-sm">
        Instant quote configurator coming soon — for now, get in touch to discuss your project.
      </p>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const service = await queryServiceBySlug({ slug })

  return {
    description: service?.description || undefined,
    title: service?.title || 'Service',
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
