import type { Metadata } from 'next'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { Media } from '@/components/Media'
import { getBlogPostIcon } from '@/components/illustrations/blogIcons'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { formatDateTime } from '@/utilities/formatDateTime'
import { generateMeta } from '@/utilities/generateMeta'
import { getServerSideURL } from '@/utilities/getURL'
import { buildArticleJsonLd, buildBreadcrumbListJsonLd } from '@/utilities/jsonLd'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ArrowLeftIcon } from 'lucide-react'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'guides',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: { authorName: { exists: true } },
    select: {
      slug: true,
    },
  })

  return posts.docs.map(({ slug }) => ({ slug }))
}

export default async function BlogPostPage({ params }: Args) {
  const { slug } = await params
  const post = await queryBlogPostBySlug({ slug })

  if (!post) return notFound()

  const { hero, layout, coverImage, authorName, authorTitle } = post

  const baseUrl = getServerSideURL()
  const breadcrumb = [
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
    { name: post.title, url: `${baseUrl}/blog/${post.slug}` },
  ]

  const bannerMedia = hero?.media || coverImage
  const hasBannerMedia = bannerMedia && typeof bannerMedia === 'object'
  const Icon = getBlogPostIcon(post.slug)

  const siteSettings = await getCachedGlobal('site-settings', 0)()
  const postUrl = `${baseUrl}/blog/${post.slug}`
  const postImage = hasBannerMedia && typeof bannerMedia === 'object' ? bannerMedia.url : undefined

  return (
    <article className="pb-24">
      <JsonLd data={buildBreadcrumbListJsonLd(breadcrumb)} />
      <JsonLd
        data={buildArticleJsonLd({
          authorName,
          dateModified: post.updatedAt,
          datePublished: post.createdAt,
          description: post.excerpt || post.meta?.description,
          imageUrl: postImage ? `${baseUrl}${postImage}` : undefined,
          organizationName: siteSettings?.organizationName,
          title: post.title,
          url: postUrl,
        })}
      />

      {/* One consistent reading column for the whole post — the shared block
          components each render their own full-width `.container`, so
          nesting everything inside a capped-width wrapper keeps the hero,
          banner, and body all the same width. */}
      <div className="mx-auto max-w-3xl">
        <div className="container pt-8">
          <Link
            className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
            href="/blog"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Blog
          </Link>

          {/* Hero — title, excerpt, and byline in one card, first on the page */}
          <div className="from-primary/5 to-orange/5 rounded-3xl border border-border bg-gradient-to-br p-8 md:p-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{post.excerpt}</p>
            )}

            {authorName && (
              <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
                <div className="avatar avatar-placeholder">
                  <div className="bg-primary/10 text-primary w-11 rounded-full">
                    <span className="font-semibold">{authorName.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">{authorName}</div>
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    {authorTitle && (
                      <>
                        <span>{authorTitle}</span>
                        <span aria-hidden>·</span>
                      </>
                    )}
                    <span>{formatDateTime({ date: post.createdAt, format: 'MMM d, yyyy' })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="container mt-8 mb-12">
          {hasBannerMedia ? (
            <Media
              className="relative aspect-video overflow-hidden rounded-2xl border border-border"
              fill
              imgClassName="object-cover"
              resource={bannerMedia}
            />
          ) : (
            <div className="from-orange/25 to-orange/10 border-orange/20 relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br">
              <Icon className="text-orange size-20" />
            </div>
          )}
        </div>

        <RenderBlocks blocks={layout} />
      </div>
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params

  const post = await queryBlogPostBySlug({ slug })

  if (!post) return notFound()

  return generateMeta({ doc: post, path: `/blog/${slug}` })
}

const queryBlogPostBySlug = async ({ slug }: { slug: string }) => {
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
        { authorName: { exists: true } },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
  })

  return result.docs?.[0] || null
}
