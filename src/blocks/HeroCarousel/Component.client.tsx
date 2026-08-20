'use client'

import type { HeroCarouselBlock } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { CarouselDots } from '@/components/ui/carousel-dots'
import Autoplay from 'embla-carousel-autoplay'
import { ArrowRight, Sparkles, StarIcon, Zap } from 'lucide-react'
import Link from 'next/link'
import React, { useRef, useState } from 'react'

import './HeroCarouselClient.css'

type Slide = NonNullable<HeroCarouselBlock['slides']>[number]
type HeroStats = { componentCount: number; reviewMessage: string }

/* -------------------------------------------------------------------------- */
/* Hero content                                                                */
/* -------------------------------------------------------------------------- */

const HeroContent = ({ slide, stats }: { slide: Slide; stats: HeroStats }) => {
  return (
    <div className="pmc-hero-content">
      {slide.badge && (
        <div className="pmc-badge">
          <span className="pmc-badge-dot" />
          <Sparkles className="size-3 text-primary" />
          <span>{slide.badge}</span>
        </div>
      )}

      <h1 className="pmc-heading">{slide.heading}</h1>

      {slide.subheading && <p className="pmc-description">{slide.subheading}</p>}

      <div className="pmc-actions">
        {slide.link?.label ? (
          <CMSLink {...slide.link} size="lg" className="pmc-shop-button" />
        ) : (
          <Link href="/shop" className="pmc-shop-button">
            Shop All Products
          </Link>
        )}

        <Link href="/shop" className="pmc-explore-button group">
          <span>Explore Products</span>
          <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="pmc-hero-trust">
        <div className="pmc-stat-line">
          <span>
            <strong>{stats.componentCount}+</strong> components in stock
          </span>
          <span className="pmc-stat-divider" />
          <span className="pmc-stat-rating">
            <StarIcon className="size-3.5 fill-current" />
            {stats.reviewMessage}
          </span>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Product visual                                                              */
/* -------------------------------------------------------------------------- */

const ProductVisual = ({ slide, priority }: { slide: Slide; priority?: boolean }) => {
  return (
    <div className="pmc-product-visual">
      {/* Ambient Lighting Behind Product */}
      <div className="pmc-ambient-glow" />

      <div className="pmc-product-media-wrapper">
        {slide.image && typeof slide.image === 'object' ? (
          <Media
            className="pmc-media-inner"
            fill
            priority={priority}
            resource={slide.image}
            imgClassName="pmc-product-image"
            size="(max-width: 900px) 100vw, 35vw"
          />
        ) : (
          <div className="pmc-product-placeholder">
            <Zap className="size-16 text-primary/30" />
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Split slide                                                                 */
/* -------------------------------------------------------------------------- */

const SplitSlide = ({
  slide,
  priority,
  stats,
}: {
  slide: Slide
  priority?: boolean
  stats: HeroStats
}) => {
  return (
    <div className="pmc-hero">
      <div className="pmc-hero-bg" />

      <div className="pmc-hero-left">
        <HeroContent slide={slide} stats={stats} />
      </div>

      <div className="pmc-hero-right">
        <ProductVisual slide={slide} priority={priority} />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Full image slide                                                            */
/* -------------------------------------------------------------------------- */

const FullBleedSlide = ({
  slide,
  priority,
  stats,
}: {
  slide: Slide
  priority?: boolean
  stats: HeroStats
}) => {
  return (
    <div className="pmc-full-slide">
      <Media
        className="pmc-full-media"
        fill
        priority={priority}
        resource={slide.image}
        imgClassName="pmc-full-image"
      />

      <div className="pmc-full-overlay" />

      <div className="pmc-full-content">
        <HeroContent slide={slide} stats={stats} />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

export const HeroCarouselClient: React.FC<{
  slides: Slide[]
  stats: HeroStats
}> = ({ slides, stats }) => {
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
    <div className="pmc-carousel-wrapper">
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
                <SplitSlide priority={index === 0} slide={slide} stats={stats} />
              ) : (
                <FullBleedSlide priority={index === 0} slide={slide} stats={stats} />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {slides.length > 1 && (
        <CarouselDots
          activeDotClassName="w-8 bg-primary"
          api={api}
          className="pmc-carousel-dots"
          dotClassName="size-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
        />
      )}
    </div>
  )
}
