import type { Metadata } from 'next'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { FormBlock } from '@/blocks/Form/Component'
import { FeaturedCategories } from '@/components/FeaturedCategories'
import { CustomerSupport } from '@/components/Footer/CustomerSupport'
import { JsonLd } from '@/components/JsonLd'
import { NewArrivals } from '@/components/NewArrivals'
import { RecommendedForYou } from '@/components/RecommendedForYou'
import { RecentlyViewedProducts } from '@/components/product/RecentlyViewedProducts'
import { ScrollReveal } from '@/components/ScrollReveal'
import { TrendingNow } from '@/components/TrendingNow'
import { homeStaticData } from '@/endpoints/seed/home-static'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getServerSideURL } from '@/utilities/getURL'
import { buildBreadcrumbListJsonLd } from '@/utilities/jsonLd'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'

import type { Page, SiteSetting } from '@/payload-types'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

const devPageCache = new Map<string, Page | null>()

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home'
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params }: Args) {
  const { slug = 'home' } = await params
  const url = '/' + slug

  let page = await queryPageBySlug({
    slug,
  })

  // Remove this code once your website is seeded
  if (!page && slug === 'home') {
    page = homeStaticData() as Page
  }

  if (!page) {
    return notFound()
  }

  const { hero, layout } = page

  const baseUrl = getServerSideURL()
  const breadcrumb =
    slug === 'home'
      ? [{ name: 'Home', url: baseUrl }]
      : [
          { name: 'Home', url: baseUrl },
          { name: page.title, url: `${baseUrl}/${slug}` },
        ]

  // On home, "Shop by Category" (FeaturedCategories) is hardcoded outside the
  // CMS layout builder — slot it in as the 2nd section (after the hero
  // carousel, which is layout block 0) rather than before everything.
  const isHome = slug === 'home'
  const firstBlock = isHome ? layout.slice(0, 1) : []
  const remainingBlocks = isHome ? layout.slice(1) : layout

  // NewArrivals (hardcoded, like FeaturedCategories/TrendingNow above) renders
  // just above the FAQ block rather than after the whole CMS layout — split
  // remainingBlocks at 'faq' so it can be slotted in between.
  const faqIndex = isHome ? remainingBlocks.findIndex((block) => block.blockType === 'faq') : -1
  const blocksBeforeFaq = faqIndex === -1 ? remainingBlocks : remainingBlocks.slice(0, faqIndex)
  const blocksFromFaq = faqIndex === -1 ? [] : remainingBlocks.slice(faqIndex)

  // The contact page pairs its CMS-managed form with a "how else to reach us"
  // panel sourced from Site Settings — that panel isn't part of the layout
  // builder, so it's slotted in here alongside whichever block holds the form.
  const isContact = slug === 'contact'
  const formBlockData = isContact ? layout.find((block) => block.blockType === 'formBlock') : undefined
  const otherBlocks = isContact ? layout.filter((block) => block.blockType !== 'formBlock') : layout
  const siteSettings: SiteSetting | null = isContact ? await getCachedGlobal('site-settings', 1)() : null

  return (
    <article className="pb-12">
      <JsonLd data={buildBreadcrumbListJsonLd(breadcrumb)} />
      <RenderHero {...hero} />
      {isHome ? (
        <>
          {/* Each section below fetches its own data independently. Without a Suspense
              boundary per section, sibling async Server Components render one after
              another rather than concurrently — one slow query would otherwise stall
              every section after it, and the whole page's TTFB becomes the sum of all
              of them instead of the slowest one. */}
          <RenderBlocks blocks={firstBlock} noTopSpacing />
          <ScrollReveal>
            <Suspense fallback={null}>
              <FeaturedCategories />
            </Suspense>
          </ScrollReveal>
          <ScrollReveal>
            <Suspense fallback={null}>
              <TrendingNow />
            </Suspense>
          </ScrollReveal>
          <ScrollReveal>
            <RecommendedForYou />
          </ScrollReveal>
          <RenderBlocks blocks={blocksBeforeFaq} />
          <ScrollReveal>
            <Suspense fallback={null}>
              <NewArrivals />
            </Suspense>
          </ScrollReveal>
          <RenderBlocks blocks={blocksFromFaq} />
          <ScrollReveal>
            <RecentlyViewedProducts />
          </ScrollReveal>
        </>
      ) : isContact ? (
        <>
          <div className="container mt-10">
            <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
              <div className="border-border bg-card rounded-2xl border p-6">
                <h2 className="text-foreground mb-5 text-lg font-semibold">Other ways to reach us</h2>
                <CustomerSupport supportEmail={siteSettings?.supportEmail} supportPhone={siteSettings?.supportPhone} />
              </div>
              {formBlockData && (
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - weird type mismatch here, same as RenderBlocks
                <FormBlock className="w-full" {...formBlockData} />
              )}
            </div>
          </div>
          <RenderBlocks blocks={otherBlocks} />
        </>
      ) : (
        <RenderBlocks blocks={layout} />
      )}
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = 'home' } = await params

  const page = await queryPageBySlug({
    slug,
  })

  return generateMeta({ doc: page, path: slug === 'home' ? '/' : `/${slug}` })
}

const queryPageBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const cacheKey = `${slug}:${draft ? 'draft' : 'published'}`
  if (process.env.NODE_ENV !== 'production' && !draft && devPageCache.has(cacheKey)) {
    return devPageCache.get(cacheKey) || null
  }

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
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
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
  })

  const page = result.docs?.[0] || null
  if (process.env.NODE_ENV !== 'production' && !draft) devPageCache.set(cacheKey, page)
  return page
}
