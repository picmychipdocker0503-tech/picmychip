'use client'

import type { HeroCarouselBlock } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { CarouselDots } from '@/components/ui/carousel-dots'
import Autoplay from 'embla-carousel-autoplay'
import { Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import React, { useRef, useState } from 'react'

import './MobileHeroCarousel.css'

type Slide = NonNullable<HeroCarouselBlock['slides']>[number]
type HeroStats = { componentCount: number; reviewMessage: string }

/* -------------------------------------------------------------------------- */
/* Slide content — compact banner: badge, one heading line and a half, one   */
/* line of copy, single CTA. No stat line, no secondary button — there's no  */
/* room for a second tier of content in a 190-220px banner.                  */
/* -------------------------------------------------------------------------- */

const MobileSlideText = ({ slide }: { slide: Slide }) => (
  <div className="mhc-left">
    {slide.badge && (
      <div className="mhc-badge">
        <Sparkles />
        <span>{slide.badge}</span>
      </div>
    )}

    {/* Always an h2 — the page's actual h1 lives in the desktop hero tree,
        which renders alongside this one (shown/hidden by CSS, not swapped),
        so there must only ever be one h1 in the document regardless of
        viewport. */}
    <h2 className="mhc-heading">{slide.heading}</h2>

    {slide.subheading && (
      <p className="mhc-description">
        {slide.subheading
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)[0]}
      </p>
    )}

    {slide.link?.label ? (
      <CMSLink {...slide.link} className="mhc-cta" />
    ) : (
      <Link className="mhc-cta" href="/shop">
        Shop Now
      </Link>
    )}
  </div>
)

const MobileProductVisual = ({ slide, priority }: { slide: Slide; priority?: boolean }) => (
  <div className="mhc-right">
    <div className="mhc-ambient-glow" />
    <div className="mhc-media-wrapper">
      {slide.image && typeof slide.image === 'object' ? (
        <Media
          className="mhc-media-inner"
          fill
          priority={priority}
          resource={slide.image}
          imgClassName="mhc-image"
          size="45vw"
        />
      ) : (
        <div className="mhc-placeholder">
          <Zap className="size-10 text-primary/30" />
        </div>
      )}
    </div>
  </div>
)

const MobileSplitSlide = ({ slide, priority }: { slide: Slide; priority?: boolean }) => (
  <div className="mhc-card">
    <div className="mhc-bg" />
    <MobileSlideText slide={slide} />
    <MobileProductVisual priority={priority} slide={slide} />
  </div>
)

const MobileFullBleedSlide = ({ slide, priority }: { slide: Slide; priority?: boolean }) => (
  <div className="mhc-full-card">
    <Media className="mhc-full-media" fill priority={priority} resource={slide.image} imgClassName="mhc-full-image" />
    <div className="mhc-full-overlay" />
    <div className="mhc-full-content">
      <MobileSlideText slide={slide} />
    </div>
  </div>
)

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

export const MobileHeroCarousel: React.FC<{
  slides: Slide[]
  stats: HeroStats
}> = ({ slides }) => {
  const [api, setApi] = useState<CarouselApi>()

  const autoplay = useRef(
    Autoplay({
      delay: 6000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  )

  if (!slides?.length) return null

  return (
    <div className="mhc-wrapper">
      <Carousel
        opts={{
          loop: slides.length > 1,
          align: 'start',
        }}
        plugins={slides.length > 1 ? [autoplay.current] : []}
        setApi={setApi}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id ?? index}>
              {slide.layout === 'split' ? (
                <MobileSplitSlide priority={index === 0} slide={slide} />
              ) : (
                <MobileFullBleedSlide priority={index === 0} slide={slide} />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {slides.length > 1 && (
        <CarouselDots
          activeDotClassName="w-6 bg-primary"
          api={api}
          className="mhc-dots"
          dotClassName="size-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
        />
      )}
    </div>
  )
}
