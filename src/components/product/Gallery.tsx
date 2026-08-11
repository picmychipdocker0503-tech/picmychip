'use client'

import type { Media as MediaType, Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { GridTileImage } from '@/components/Grid/tile'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  gallery: NonNullable<Product['gallery']>
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const searchParams = useSearchParams()
  const [current, setCurrent] = React.useState(0)
  const [api, setApi] = React.useState<CarouselApi>()
  const [lightboxOpen, setLightboxOpen] = React.useState(false)

  useEffect(() => {
    if (!api) {
      return
    }
  }, [api])

  useEffect(() => {
    const values = Array.from(searchParams.values())

    if (values && api) {
      const index = gallery.findIndex((item) => {
        if (!item.variantOption) return false

        let variantID: DefaultDocumentIDType

        if (typeof item.variantOption === 'object') {
          variantID = item.variantOption.id
        } else variantID = item.variantOption

        return Boolean(values.find((value) => value === String(variantID)))
      })
      if (index !== -1) {
        setCurrent(index)
        api.scrollTo(index, true)
      }
    }
  }, [searchParams, api, gallery])

  return (
    <div>
      <button
        aria-label="Zoom image"
        className="group relative mb-8 block w-full cursor-zoom-in overflow-hidden"
        onClick={() => setLightboxOpen(true)}
        type="button"
      >
        <Media resource={gallery[current].image} className="w-full" imgClassName="w-full rounded-lg" />
        <span className="bg-background/90 text-foreground absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <ZoomInIcon className="size-3.5" />
          Zoom
        </span>
      </button>

      <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent>
          {gallery.map((item, i) => {
            if (typeof item.image !== 'object') return null

            return (
              <CarouselItem
                className="basis-1/5"
                key={`${item.image.id}-${i}`}
                onClick={() => setCurrent(i)}
              >
                <GridTileImage active={i === current} media={item.image} />
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      <Dialog onOpenChange={setLightboxOpen} open={lightboxOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none sm:max-w-3xl">
          <DialogTitle className="sr-only">Product image</DialogTitle>
          <div className="relative aspect-square w-full">
            <Media resource={gallery[current].image} className="h-full w-full" fill imgClassName="object-contain" />
          </div>

          {gallery.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                aria-label="Previous image"
                className="bg-background/90 flex size-9 items-center justify-center rounded-full border shadow-sm"
                onClick={() => setCurrent((prev) => (prev - 1 + gallery.length) % gallery.length)}
                type="button"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <span className="bg-background/90 rounded-full border px-3 py-1 text-xs font-medium shadow-sm">
                {current + 1} / {gallery.length}
              </span>
              <button
                aria-label="Next image"
                className="bg-background/90 flex size-9 items-center justify-center rounded-full border shadow-sm"
                onClick={() => setCurrent((prev) => (prev + 1) % gallery.length)}
                type="button"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
