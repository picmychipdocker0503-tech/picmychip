import type { TestimonialsBlock as TestimonialsBlockProps } from '@/payload-types'

import { CommunityVoice } from '@/components/illustrations'
import { RatingStars } from '@/components/RatingStars'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { MessageSquareHeart } from 'lucide-react'
import React from 'react'

import { MobileTestimonialsCarousel } from './MobileTestimonialsCarousel'
import { TestimonialsCarousel, type TestimonialCard as Card } from './TestimonialsCarousel'

export const TestimonialsBlock: React.FC<
  TestimonialsBlockProps & {
    id?: string | number
  }
> = async ({ heading, populateBy, testimonials, minRating, limit }) => {
  let cards: Card[] = []

  if (populateBy === 'reviews') {
    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'reviews',
      depth: 1,
      limit: limit || 6,
      sort: '-rating',
      where: {
        and: [
          { status: { equals: 'approved' } },
          { rating: { greater_than_equal: minRating || 4 } },
        ],
      },
    })

    cards = docs
      .filter((review) => review.comment)
      .map((review) => ({
        key: review.id,
        name: typeof review.customer === 'object' ? review.customer?.name || 'Verified Customer' : 'Verified Customer',
        role: review.verifiedPurchase ? 'Verified Buyer' : undefined,
        rating: review.rating,
        quote: review.comment!,
        product: typeof review.product === 'object' ? review.product : undefined,
      }))
  } else if (populateBy === 'communityFeedback') {
    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'community-feedback',
      depth: 1,
      limit: limit || 6,
      sort: '-createdAt',
      where: {
        featured: { equals: true },
      },
    })

    cards = docs.map((entry) => ({
      key: entry.id,
      name: entry.name,
      photo: typeof entry.image === 'object' ? entry.image : undefined,
      role: entry.designation ?? undefined,
      companyName: entry.companyName,
      rating: 5,
      quote: entry.feedback,
    }))
  } else {
    cards = (testimonials ?? []).map((testimonial, index) => ({
      key: testimonial.id ?? index,
      name: testimonial.name,
      photo: typeof testimonial.photo === 'object' ? testimonial.photo : undefined,
      role: testimonial.role,
      rating: testimonial.rating,
      quote: testimonial.quote,
      product: typeof testimonial.product === 'object' ? testimonial.product : undefined,
    }))
  }

  if (cards.length === 0) return null

  // Two-tone headline: bold/dark statement, then a muted continuation on
  // its own line — split at an em/en dash if the heading (CMS-provided or
  // the default below) contains one, otherwise it just renders as one
  // solid-color line.
  const headingText = heading || 'What Hardware Builders Say — And Keep Coming Back.'
  const dashIndex = headingText.search(/[–—]/)
  const headingMain = dashIndex === -1 ? headingText : headingText.slice(0, dashIndex).trim()
  const headingSub = dashIndex === -1 ? null : headingText.slice(dashIndex).trim()

  const avgRating = cards.reduce((sum, card) => sum + card.rating, 0) / cards.length

  return (
    <section className="container my-20">
      <div className="flex flex-col gap-10">
        {/* Top row: Heading & Illustrated Rating Panel, side by side on
            larger screens */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20 mb-3">
              <MessageSquareHeart className="size-3.5" />
              COMMUNITY FEEDBACK
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              <span className="text-foreground">{headingMain}</span>
              {headingSub && (
                <>
                  <br />
                  <span className="text-muted-foreground">{headingSub}</span>
                </>
              )}
            </h2>

            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Real feedback from engineers, makers, and labs who rely on our spec-verified component catalog.
            </p>
          </div>

          <div className="relative w-full shrink-0 overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-sm lg:w-80">
            <CommunityVoice className="text-primary size-14" />

            <div className="mt-6 flex items-end gap-3">
              <span className="text-4xl font-black tracking-tight text-foreground">{avgRating.toFixed(1)}</span>
              <div className="mb-1">
                <RatingStars rating={avgRating} />
                <p className="text-muted-foreground mt-1 text-xs">
                  from {cards.length} verified {cards.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: an animated, auto-advancing slide carousel rather
            than a static stack — reads fine whether there's one testimonial
            or a dozen, and gives the section some motion. Mobile gets its
            own simpler carousel/card (own Embla instance, same `cards`
            data — no extra fetching) rather than the desktop card shrunk
            down. */}
        <div className="hidden md:block">
          <TestimonialsCarousel cards={cards} />
        </div>
        <MobileTestimonialsCarousel cards={cards} />
      </div>
    </section>
  )
}
