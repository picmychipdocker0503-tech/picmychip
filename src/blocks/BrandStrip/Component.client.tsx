'use client'

import type { Brand } from '@/payload-types'

import { Media } from '@/components/Media'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import AutoScroll from 'embla-carousel-auto-scroll'
import React from 'react'

export const BrandStripClient: React.FC<{ brands: Brand[] }> = ({ brands }) => {
  // Duplicated so the marquee loops smoothly and doesn't run dry on wide screens.
  const loopedBrands = [...brands, ...brands, ...brands]

  return (
    <Carousel
      className="w-full"
      opts={{ align: 'start', loop: true }}
      plugins={[
        AutoScroll({
          playOnInit: true,
          speed: 1,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent>
        {loopedBrands.map((brand, index) => (
          <CarouselItem
            className="flex basis-1/3 items-center justify-center sm:basis-1/4 md:basis-1/6"
            key={`${brand.id}-${index}`}
          >
            <div className="border-border/60 flex h-20 w-full max-w-40 items-center justify-center rounded-xl border bg-transparent p-3 grayscale transition-all duration-300 hover:grayscale-0">
              {typeof brand.logo === 'object' && brand.logo?.url ? (
                <Media className="relative h-full w-full" fill imgClassName="object-contain" resource={brand.logo} />
              ) : (
                <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">{brand.title}</span>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
