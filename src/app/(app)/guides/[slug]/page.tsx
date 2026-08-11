import type { Metadata } from 'next'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { JsonLd } from '@/components/JsonLd'
import { Media } from '@/components/Media'
import { getCategoryIcon } from '@/components/illustrations/categoryIcons'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { generateMeta } from '@/utilities/generateMeta'
import { getServerSideURL } from '@/utilities/getURL'
import { buildArticleJsonLd, buildBreadcrumbListJsonLd } from '@/utilities/jsonLd'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const guides = await payload.find({
    collection: 'guides',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: { authorName: { exists: false } },
    select: {
      slug: true,
    },
  })

  return guides.docs.map(({ slug }) => ({ slug }))
}

export default async function GuidePage({ params }: Args) {
  const { slug } = await params
  const guide = await queryGuideBySlug({ slug })

  if (!guide) return notFound()

  const { hero, layout, coverImage, relatedCategory } = guide

  const baseUrl = getServerSideURL()
  const breadcrumb = [
    { name: 'Home', url: baseUrl },
    { name: 'Guides', url: `${baseUrl}/guides` },
    { name: guide.title, url: `${baseUrl}/guides/${guide.slug}` },
  ]

  const bannerMedia = hero?.media || coverImage
  const hasBannerMedia = bannerMedia && typeof bannerMedia === 'object'
  const categorySlug = typeof relatedCategory === 'object' ? relatedCategory?.slug : undefined
  const Icon = getCategoryIcon(categorySlug)

  const siteSettings = await getCachedGlobal('site-settings', 0)()
  const articleUrl = `${baseUrl}/guides/${guide.slug}`
  const articleImage = hasBannerMedia && typeof bannerMedia === 'object' ? bannerMedia.url : undefined

  return (
    <article className="pt-16 pb-24">
      <JsonLd data={buildBreadcrumbListJsonLd(breadcrumb)} />
      <JsonLd
        data={buildArticleJsonLd({
          dateModified: guide.updatedAt,
          datePublished: guide.createdAt,
          description: guide.excerpt || guide.meta?.description,
          imageUrl: articleImage ? `${baseUrl}${articleImage}` : undefined,
          organizationName: siteSettings?.organizationName,
          title: guide.title,
          url: articleUrl,
        })}
      />
      <RenderHero {...hero} />
      <div className="container mb-12">
        {hasBannerMedia ? (
          <Media
            className="relative aspect-[21/9] overflow-hidden rounded-3xl border border-border"
            fill
            imgClassName="object-cover"
            resource={bannerMedia}
          />
        ) : (
          <div className="from-orange/25 to-orange/10 border-orange/20 relative flex aspect-[21/9] items-center justify-center overflow-hidden rounded-3xl border bg-gradient-to-br">
            <Icon className="text-orange size-24" />
          </div>
        )}
      </div>
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params

  const guide = await queryGuideBySlug({ slug })

  if (!guide) return notFound()

  return generateMeta({ doc: guide, path: `/guides/${slug}` })
}

const queryGuideBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'guides',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        { authorName: { exists: false } },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
  })

  return result.docs?.[0] || null
}
