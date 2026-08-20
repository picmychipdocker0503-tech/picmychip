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
    <div
      className="w-full"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
      }}
    >
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
              className="flex basis-1/3 items-center justify-center border-r border-border/50 sm:basis-1/4 md:basis-1/6"
              key={`${brand.id}-${index}`}
            >
              <div className="flex h-9 w-full max-w-36 items-center justify-center px-4">
                {typeof brand.logo === 'object' && brand.logo?.url ? (
                  <Media
                    className="relative h-full w-full grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
                    fill
                    imgClassName="object-contain"
                    resource={brand.logo}
                    size="144px"
                  />
                ) : (
                  <span className="text-muted-foreground hover:text-foreground text-sm font-bold tracking-wide whitespace-nowrap uppercase transition-colors">
                    {brand.title}
                  </span>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
