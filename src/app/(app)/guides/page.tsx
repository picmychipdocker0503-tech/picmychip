import { Grid } from '@/components/Grid'
import { Media } from '@/components/Media'
import { getCategoryIcon } from '@/components/illustrations/categoryIcons'
import { getGuideIllustration } from '@/components/illustrations/guides'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

export const metadata = {
  description: 'Build guides and component comparisons for makers.',
  title: 'Guides — Picmychip: Electronic Components Store',
}

export default async function GuidesPage() {
  const payload = await getPayload({ config: configPromise })

  const guides = await payload.find({
    collection: 'guides',
    depth: 1,
    draft: false,
    overrideAccess: false,
    sort: '-updatedAt',
    // Author-bylined posts live on /blog instead — keep the two listings distinct.
    where: { authorName: { exists: false } },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      hero: true,
      coverImage: true,
      relatedCategory: true,
    },
  })

  return (
    <div className="container py-16">
      <h1 className="mb-8 text-3xl font-bold">Guides</h1>

      {guides.docs.length > 0 ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.docs.map((guide) => {
            const media = guide.hero?.media || guide.coverImage
            const categorySlug =
              typeof guide.relatedCategory === 'object' ? guide.relatedCategory?.slug : undefined
            const Illustration = getGuideIllustration(guide.slug)
            const Icon = getCategoryIcon(categorySlug)

            return (
              <Link
                className="group flex flex-col gap-4"
                href={`/guides/${guide.slug}`}
                key={guide.id}
              >
                {media && typeof media === 'object' ? (
                  <Media
                    className="relative aspect-video overflow-hidden rounded-2xl border border-border"
                    fill
                    imgClassName="object-cover"
                    resource={media}
                  />
                ) : Illustration ? (
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-border">
                    <Illustration className="absolute inset-0 h-full w-full" />
                  </div>
                ) : (
                  <div className="card-hover from-orange/25 to-orange/10 border-orange/20 relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br">
                    <Icon className="text-orange size-14" />
                  </div>
                )}
                <div>
                  <div className="font-semibold group-hover:text-primary transition-colors">{guide.title}</div>
                  {guide.excerpt && (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{guide.excerpt}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </Grid>
      ) : (
        <p className="text-muted-foreground">No guides published yet.</p>
      )}
    </div>
  )
}
