import type { ContentFeedBlock as ContentFeedBlockProps, Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { getCategoryIcon } from '@/components/illustrations/categoryIcons'
import configPromise from '@payload-config'
import { PlayCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

export const ContentFeedBlock: React.FC<
  ContentFeedBlockProps & {
    id?: string | number
  }
> = async ({ heading, filterBy, limit }) => {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'guides',
    depth: 1,
    limit: limit || 4,
    sort: '-createdAt',
    where: {
      and: [
        { _status: { equals: 'published' } },
        ...(filterBy && filterBy !== 'all' ? [{ contentType: { equals: filterBy } }] : []),
      ],
    },
  })

  if (docs.length === 0) return null

  return (
    <div className="container">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
        <Link className="text-primary text-sm font-medium hover:underline" href="/guides">
          View All →
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {docs.map((guide) => {
          const cover = typeof guide.coverImage === 'object' ? (guide.coverImage as MediaType) : undefined
          const categorySlug =
            typeof guide.relatedCategory === 'object' ? guide.relatedCategory?.slug : undefined
          const Icon = getCategoryIcon(categorySlug)

          return (
            <Link
              className="card-hover group border-border w-[75%] shrink-0 snap-start overflow-hidden rounded-2xl border sm:w-auto"
              href={`/guides/${guide.slug}`}
              key={guide.id}
            >
              <div className="from-orange/25 to-orange/10 relative aspect-video overflow-hidden bg-gradient-to-br">
                {cover ? (
                  <Media
                    className="absolute inset-0"
                    fill
                    imgClassName="object-cover transition-transform duration-500 group-hover:scale-105"
                    resource={cover}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className="text-orange size-10" />
                  </div>
                )}
                {guide.contentType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <PlayCircleIcon className="size-12 text-white drop-shadow" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="group-hover:text-primary mb-1 line-clamp-2 font-semibold transition-colors">{guide.title}</h3>
                {guide.excerpt && <p className="text-muted-foreground line-clamp-2 text-sm">{guide.excerpt}</p>}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
