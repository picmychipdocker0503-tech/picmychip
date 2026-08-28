'use client'

import { Media } from '@/components/Media'
import { RatingStars } from '@/components/RatingStars'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { CarouselDots } from '@/components/ui/carousel-dots'
import Autoplay from 'embla-carousel-autoplay'
import { Quote, ShieldCheck } from 'lucide-react'
import React, { useRef, useState } from 'react'

import type { TestimonialCard } from './TestimonialsCarousel'

const AUTOPLAY_DELAY = 6000

function MobileTestimonialSlide({ card }: { card: TestimonialCard }) {
  return (
    <div className="border-border/80 bg-card/60 flex flex-col gap-4 rounded-3xl border p-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary border-primary/20 flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold">
          {card.photo?.url ? (
            <Media className="rounded-full" imgClassName="rounded-full object-cover" resource={card.photo} size="40px" />
          ) : (
            card.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <div className="text-foreground truncate text-sm font-bold">{card.name}</div>
          {(card.role || card.companyName) && (
            <div className="text-muted-foreground truncate text-xs">
              {[card.role, card.companyName].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <RatingStars rating={card.rating} />
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
          <ShieldCheck className="size-3" />
          Verified
        </span>
      </div>

      <div>
        <Quote className="text-primary/25 mb-1.5 size-4" />
        <p className="text-foreground text-sm leading-relaxed font-medium">&ldquo;{card.quote}&rdquo;</p>
      </div>
    </div>
  )
}

/**
 * Mobile's own testimonials carousel — a simpler card (no side-by-side
 * avatar/quote layout, no hover-triggered animation since touch devices
 * don't hover) instead of the desktop card shrunk down. Own Embla instance,
 * fed the same already-fetched `cards` prop as the desktop carousel — no
 * extra data fetching, just a different presentation.
 */
export function MobileTestimonialsCarousel({ cards }: { cards: TestimonialCard[] }) {
  const [api, setApi] = useState<CarouselApi>()

  const autoplay = useRef(
    Autoplay({
      delay: AUTOPLAY_DELAY,
      stopOnInteraction: false,
    }),
  )

  if (cards.length === 0) return null

  return (
    <div className="md:hidden">
      <Carousel
        opts={{ align: 'start', loop: cards.length > 1 }}
        plugins={cards.length > 1 ? [autoplay.current] : []}
        setApi={setApi}
      >
        <CarouselContent>
          {cards.map((card) => (
            <CarouselItem key={card.key}>
              <MobileTestimonialSlide card={card} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {cards.length > 1 && (
        <CarouselDots
          activeDotClassName="w-6 bg-primary"
          api={api}
          className="mt-4 justify-center"
          dotClassName="size-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
        />
      )}
    </div>
  )
}
