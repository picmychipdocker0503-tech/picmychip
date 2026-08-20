import type { Media as MediaType, Product, TestimonialsBlock as TestimonialsBlockProps } from '@/payload-types'

import { CommunityVoice } from '@/components/illustrations'
import { Media } from '@/components/Media'
import { RatingStars } from '@/components/RatingStars'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { MessageSquareHeart, Quote, ShieldCheck } from 'lucide-react'
import React from 'react'

type Card = {
  key: string | number
  name: string
  photo?: MediaType | null
  role?: string | null
  companyName?: string | null
  rating: number
  quote: string
  product?: Product | null
}

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
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16 lg:items-start">
        {/* Left Column: Heading & Illustrated Rating Panel */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
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

            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 mt-8 shadow-sm">
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
        </div>

        {/* Right Column: Testimonial List — a vertical stack rather than a
            fixed-column grid, so it reads as complete whether there's one
            testimonial or a dozen, instead of leaving empty grid cells. */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {cards.map((card) => (
            <div
              className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-7 shadow-sm transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-lg sm:flex-row sm:items-start"
              key={card.key}
            >
              <div className="flex shrink-0 items-center gap-3 sm:w-40 sm:flex-col sm:items-start">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-sm">
                  {card.photo?.url ? (
                    <Media
                      className="rounded-full"
                      imgClassName="rounded-full object-cover"
                      resource={card.photo}
                      size="44px"
                    />
                  ) : (
                    card.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="sm:mt-1">
                  <div className="text-sm font-bold text-foreground">{card.name}</div>
                  {(card.role || card.companyName) && (
                    <div className="text-xs text-muted-foreground">
                      {[card.role, card.companyName].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-border/60 flex-1 border-t pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <RatingStars rating={card.rating} />
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                    <ShieldCheck className="size-3" />
                    Verified
                  </span>
                </div>
                <Quote className="size-5 text-primary/25 group-hover:text-primary/40 transition-colors mb-2" />
                <p className="text-foreground text-sm sm:text-base leading-relaxed font-medium">
                  &ldquo;{card.quote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
