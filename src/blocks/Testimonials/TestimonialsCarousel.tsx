'use client'

import type { Media as MediaType, Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { RatingStars } from '@/components/RatingStars'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { CarouselDots } from '@/components/ui/carousel-dots'
import Autoplay from 'embla-carousel-autoplay'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote, ShieldCheck } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import './TestimonialsCarousel.css'

export type TestimonialCard = {
  key: string | number
  name: string
  photo?: MediaType | null
  role?: string | null
  companyName?: string | null
  rating: number
  quote: string
  product?: Product | null
}

const AUTOPLAY_DELAY = 6000

const containerVariants = {
  active: { transition: { delayChildren: 0.1, staggerChildren: 0.08 } },
  inactive: {},
}

const itemVariants = {
  active: { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' as const }, y: 0 },
  inactive: { opacity: 0, y: 14 },
}

function TestimonialSlide({ card, isActive }: { card: TestimonialCard; isActive: boolean }) {
  return (
    <motion.div
      animate={isActive ? 'active' : 'inactive'}
      className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-7 shadow-sm transition-colors duration-300 hover:border-primary/50 hover:bg-card hover:shadow-lg sm:flex-row sm:items-start"
      initial="inactive"
      variants={containerVariants}
    >
      <motion.div className="flex shrink-0 items-center gap-3 sm:w-40 sm:flex-col sm:items-start" variants={itemVariants}>
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
      </motion.div>

      <div className="border-border/60 flex-1 border-t pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
        <motion.div className="flex items-center justify-between gap-2 mb-3" variants={itemVariants}>
          <RatingStars rating={card.rating} />
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
            <ShieldCheck className="size-3" />
            Verified
          </span>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Quote className="size-5 text-primary/25 group-hover:text-primary/40 transition-colors mb-2" />
        </motion.div>
        <motion.p className="text-foreground text-sm sm:text-base leading-relaxed font-medium" variants={itemVariants}>
          &ldquo;{card.quote}&rdquo;
        </motion.p>
      </div>
    </motion.div>
  )
}

export const TestimonialsCarousel: React.FC<{ cards: TestimonialCard[] }> = ({ cards }) => {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const autoplay = useRef(
    Autoplay({
      delay: AUTOPLAY_DELAY,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  )

  useEffect(() => {
    if (!api) return

    const onSelect = () => setSelectedIndex(api.selectedScrollSnap())
    onSelect()

    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  if (cards.length === 0) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Ambient glow that gently pulses behind the active slide */}
      <motion.div
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        aria-hidden="true"
        className="bg-primary/20 pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] blur-3xl"
        transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
      />

      <Carousel
        opts={{ align: 'start', loop: cards.length > 1 }}
        plugins={cards.length > 1 ? [autoplay.current] : []}
        setApi={setApi}
      >
        <CarouselContent>
          {cards.map((card, index) => (
            <CarouselItem key={card.key}>
              <TestimonialSlide card={card} isActive={index === selectedIndex} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {cards.length > 1 && (
        <div className="mt-5 flex items-center gap-4">
          <button
            aria-label="Previous testimonial"
            className="border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors"
            onClick={() => api?.scrollPrev()}
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex flex-1 flex-col items-center gap-3">
            <CarouselDots
              activeDotClassName="w-6 bg-primary"
              api={api}
              dotClassName="size-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            />
            <div className="bg-primary/10 h-1 w-full max-w-40 overflow-hidden rounded-full">
              <div
                className="pmc-testimonial-progress-fill bg-primary h-full rounded-full"
                data-paused={isHovering}
                key={selectedIndex}
                style={{ animationDuration: `${AUTOPLAY_DELAY}ms` }}
              />
            </div>
          </div>

          <button
            aria-label="Next testimonial"
            className="border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors"
            onClick={() => api?.scrollNext()}
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
