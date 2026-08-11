'use client'

import type { CarouselApi } from '@/components/ui/carousel'
import { cn } from '@/utilities/cn'
import * as React from 'react'

type Props = {
  api: CarouselApi
  className?: string
}

export function CarouselDots({ api, className }: Props) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([])

  React.useEffect(() => {
    if (!api) return

    setScrollSnaps(api.scrollSnapList())

    const onSelect = () => setSelectedIndex(api.selectedScrollSnap())
    onSelect()

    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  if (scrollSnaps.length <= 1) return null

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {scrollSnaps.map((_, index) => (
        <button
          aria-label={`Go to slide ${index + 1}`}
          className={cn(
            'size-2 rounded-full transition-all',
            index === selectedIndex ? 'bg-primary w-6' : 'bg-primary/30 hover:bg-primary/50',
          )}
          key={index}
          onClick={() => api?.scrollTo(index)}
          type="button"
        />
      ))}
    </div>
  )
}
