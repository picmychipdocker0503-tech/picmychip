'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface BrandCarouselItem {
  name: string
  logoUrl: string
  href?: string
}

export interface BrandCarouselProps {
  brands: BrandCarouselItem[]
  className?: string
}

export function BrandCarousel({ brands, className }: BrandCarouselProps) {
  const [paused, setPaused] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const track = [...brands, ...brands]

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Brand partners"
    >
      <motion.div
        className="flex w-max cursor-grab items-center gap-12 active:cursor-grabbing"
        drag="x"
        dragConstraints={containerRef}
        animate={paused ? undefined : { x: ['0%', '-50%'] }}
        transition={paused ? undefined : { duration: 24, ease: 'linear', repeat: Infinity }}
      >
        {track.map((brand, index) => {
          const image = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="h-8 w-auto shrink-0 grayscale transition-[filter] hover:grayscale-0"
              draggable={false}
            />
          )
          return (
            <div key={`${brand.name}-${index}`} className="shrink-0">
              {brand.href ? <a href={brand.href}>{image}</a> : image}
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
