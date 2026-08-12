'use client'

import type { HeroCarouselBlock, SiteSetting } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { CarouselDots } from '@/components/ui/carousel-dots'
import { getSocialIcon } from '@/utilities/getSocialIcon'
import Autoplay from 'embla-carousel-autoplay'
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import React, { useRef, useState } from 'react'

import './HeroCarouselClient.css'

type Slide = NonNullable<HeroCarouselBlock['slides']>[number]
type SocialLink = NonNullable<SiteSetting['sameAs']>[number]

/* -------------------------------------------------------------------------- */
/* Hero content                                                                */
/* -------------------------------------------------------------------------- */

const HeroContent = ({ slide, socialLinks }: { slide: Slide; socialLinks: SocialLink[] }) => {
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

        <Link href="/products" className="pmc-explore-button group">
          <span>Explore Products</span>
          <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="pmc-trust-row">
        <div className="pmc-trust-item">
          <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
          <span>Genuine Components</span>
        </div>

        <div className="pmc-trust-item">
          <Truck className="size-4 text-primary shrink-0" />
          <span>Fast Delivery</span>
        </div>

        <div className="pmc-trust-item">
          <Lock className="size-4 text-amber-500 shrink-0" />
          <span>Secure Checkout</span>
        </div>
      </div>

      {socialLinks.length > 0 && (
        <div className="pmc-social-row">
          <span>Follow us on:</span>
          <div className="pmc-social-icons">
            {socialLinks.map((social, index) => {
              const Icon = getSocialIcon(social.url)
              if (!Icon) return null
              return (
                <a
                  aria-label="Social link"
                  className="pmc-social-icon"
                  href={social.url}
                  key={social.id ?? index}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Icon className="size-3.5" />
                </a>
              )
            })}
          </div>
        </div>
      )}
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
          />
        ) : (
          <div className="pmc-product-placeholder">
            <Zap className="size-16 text-primary/30" />
          </div>
        )}
      </div>

      {/* Floating Badges */}
      <div className="pmc-floating-badge badge-top">
        <div className="pmc-badge-icon bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="size-3.5" />
        </div>
        <div>
          <strong>Spec-Verified</strong>
          <small>Datasheet guaranteed</small>
        </div>
      </div>

      <div className="pmc-floating-badge badge-bottom">
        <div className="pmc-badge-icon bg-primary/10 text-primary border border-primary/20">
          <Truck className="size-3.5" />
        </div>
        <div>
          <strong>Ready to Ship</strong>
          <small>Dispatches in 24h</small>
        </div>
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
  socialLinks,
}: {
  slide: Slide
  priority?: boolean
  socialLinks: SocialLink[]
}) => {
  return (
    <div className="pmc-hero">
      <div className="pmc-hero-bg" />

      <div className="pmc-hero-left">
        <HeroContent slide={slide} socialLinks={socialLinks} />
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
  socialLinks,
}: {
  slide: Slide
  priority?: boolean
  socialLinks: SocialLink[]
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
        <HeroContent slide={slide} socialLinks={socialLinks} />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

export const HeroCarouselClient: React.FC<{
  slides: Slide[]
  socialLinks?: SocialLink[]
}> = ({ slides, socialLinks = [] }) => {
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
                <SplitSlide slide={slide} priority={index === 0} socialLinks={socialLinks} />
              ) : (
                <FullBleedSlide slide={slide} priority={index === 0} socialLinks={socialLinks} />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {slides.length > 1 && <CarouselDots api={api} className="pmc-carousel-dots" />}
    </div>
  )
}
