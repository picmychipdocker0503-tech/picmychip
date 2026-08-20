import type { Media as MediaType, TeamCultureBlock as TeamCultureBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Quote, Sparkles } from 'lucide-react'
import React from 'react'

type Card = {
  key: string | number
  name: string
  photo?: MediaType | null
  designation?: string | null
  department?: string | null
  quote: string
}

export const TeamCultureBlock: React.FC<
  TeamCultureBlockProps & {
    id?: string | number
  }
> = async ({ heading, intro, populateBy, testimonials, limit }) => {
  let cards: Card[] = []

  if (populateBy === 'manual') {
    cards = (testimonials ?? []).map((entry, index) => ({
      key: entry.id ?? index,
      name: entry.name,
      photo: typeof entry.photo === 'object' ? entry.photo : undefined,
      designation: entry.designation,
      department: entry.department,
      quote: entry.quote,
    }))
  } else {
    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'team-testimonials',
      depth: 1,
      limit: limit || 6,
      sort: '-createdAt',
      where: {
        featured: { equals: true },
      },
    })

    // quote is optional on the collection (a team member can appear on the
    // "Team" page without one) — this section is specifically the quote
    // cards, so anyone without a real quote is skipped here rather than
    // rendering an empty quote bubble.
    cards = docs
      .filter((entry) => Boolean(entry.quote?.trim()))
      .map((entry) => ({
        key: entry.id,
        name: entry.name,
        photo: typeof entry.photo === 'object' ? entry.photo : undefined,
        designation: entry.designation,
        department: entry.department,
        quote: entry.quote as string,
      }))
  }

  if (cards.length === 0) return null

  const headingText = heading || 'Life at Picmychip'

  return (
    <section className="container my-20">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <span className="text-primary bg-primary/10 border-primary/20 mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase">
          <Sparkles className="size-3.5" />
          Life at Picmychip
        </span>
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
          <span className="text-foreground">{headingText}</span>
        </h2>
        {intro && <p className="text-muted-foreground mt-2 text-sm sm:text-base">{intro}</p>}
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            className="group border-border/80 bg-card/60 relative flex w-[85%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border p-7 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-lg sm:w-auto"
            key={card.key}
          >
            <div>
              <Quote className="text-primary/20 group-hover:text-primary/40 mb-4 size-6 transition-colors" />
              <p className="text-foreground mb-6 text-sm leading-relaxed font-medium sm:text-base">
                &ldquo;{card.quote}&rdquo;
              </p>
            </div>

            <div className="border-border/60 flex items-center gap-3 border-t pt-5">
              <div className="bg-primary/10 text-primary border-primary/20 flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold">
                {card.photo?.url ? (
                  <Media className="rounded-full" imgClassName="rounded-full object-cover" resource={card.photo} />
                ) : (
                  card.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="text-foreground text-sm font-bold">{card.name}</div>
                {(card.designation || card.department) && (
                  <div className="text-muted-foreground text-xs">
                    {[card.designation, card.department].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
