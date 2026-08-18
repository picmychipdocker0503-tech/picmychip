import type { Media as MediaType, Product, TestimonialsBlock as TestimonialsBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import { RatingStars } from '@/components/RatingStars'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { MessageSquareHeart, Quote, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
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

  return (
    <section className="container my-20">
      <div className="mx-auto max-w-3xl text-center mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20 mb-3">
          <MessageSquareHeart className="size-3.5" />
          COMMUNITY FEEDBACK
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
          <span className="text-foreground">{headingMain}</span>
          {headingSub && (
            <>
              <br />
              <span className="text-muted-foreground">{headingSub}</span>
            </>
          )}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Real feedback from engineers, makers, and labs who rely on our spec-verified component catalog.
        </p>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-lg w-[85%] shrink-0 snap-start sm:w-auto"
            key={card.key}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <RatingStars rating={card.rating} />
                <Quote className="size-6 text-primary/20 group-hover:text-primary/40 transition-colors" />
              </div>
              <p className="text-foreground text-sm sm:text-base leading-relaxed mb-6 font-medium">
                &ldquo;{card.quote}&rdquo;
              </p>
            </div>

            <div className="border-t border-border/60 pt-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-sm">
                  {card.photo?.url ? (
                    <Media className="rounded-full" imgClassName="rounded-full object-cover" resource={card.photo} />
                  ) : (
                    card.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{card.name}</div>
                  {(card.role || card.companyName) && (
                    <div className="text-xs text-muted-foreground">
                      {[card.role, card.companyName].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                <ShieldCheck className="size-3" />
                Verified
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
