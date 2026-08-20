'use client'

import type { Product, Variant } from '@/payload-types'

import { Media } from '@/components/Media'
import { GridTileImage } from '@/components/Grid/tile'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useTilt3D } from '@/lib/useTilt3D'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZapIcon, ZoomInIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  gallery: NonNullable<Product['gallery']>
  categorySlug?: string | null
  product?: Product
}

export const Gallery: React.FC<Props> = ({ gallery, product }) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addItem } = useCart()
  const [current, setCurrent] = React.useState(0)
  const [api, setApi] = React.useState<CarouselApi>()
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const tilt = useTilt3D<HTMLDivElement>()

  const variants = product?.variants?.docs || []

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (product?.enableVariants && variants.length) {
      const variantId = searchParams.get('variant')
      const validVariant = variants.find((variant) =>
        typeof variant === 'object' ? String(variant.id) === variantId : String(variant) === variantId,
      )
      if (validVariant && typeof validVariant === 'object') return validVariant
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.enableVariants, searchParams, variants])

  const isOutOfStock = product?.enableVariants
    ? !selectedVariant || selectedVariant.inventory === 0
    : product?.inventory === 0

  const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product?.id) return

    setIsBuyingNow(true)
    addItem({ product: product.id, variant: selectedVariant?.id ?? undefined })
      .then(() => {
        router.push('/checkout')
      })
      .catch(() => {
        setIsBuyingNow(false)
        toast.error('Could not start checkout — please try again.')
      })
  }

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

  // The tilt + Buy Now overlay are a "hero shot" interaction, meant for a
  // clean product photo — some gallery images (spec sheets, supplier
  // infographics with text/icons baked into the pixels) look like a whole
  // UI card, so tilting them reads as "the full card moving" rather than
  // "the photo tilting". Scoping both to only the first/primary image keeps
  // the effect feeling intentional regardless of what a later gallery image
  // contains.
  const isPrimaryImage = current === 0

  // Switching images via a thumbnail click doesn't necessarily fire
  // onMouseLeave first — clear any in-progress tilt so a leftover rotation
  // never gets stuck on the (now inert) frame.
  useEffect(() => {
    if (!isPrimaryImage) {
      if (tilt.ref.current) tilt.ref.current.style.transform = ''
      if (tilt.glareRef.current) tilt.glareRef.current.style.opacity = '0'
    }
  }, [isPrimaryImage, tilt.ref, tilt.glareRef])

  return (
    <div>
      <div
        className="group relative mb-5 transition-transform duration-150 ease-out will-change-transform"
        onMouseEnter={isPrimaryImage ? tilt.onMouseEnter : undefined}
        onMouseLeave={isPrimaryImage ? tilt.onMouseLeave : undefined}
        onMouseMove={isPrimaryImage ? tilt.onMouseMove : undefined}
        ref={isPrimaryImage ? tilt.ref : undefined}
      >
        <button
          aria-label="Zoom image"
          className="border-border bg-transparent relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border"
          onClick={() => setLightboxOpen(true)}
          type="button"
        >
          <Media
            resource={gallery[current].image}
            className="relative h-full w-full"
            fill
            imgClassName="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
            size="(max-width: 1024px) 100vw, 50vw"
          />
          <span className="bg-background/90 text-foreground absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            <ZoomInIcon className="size-3.5" />
            Zoom
          </span>
        </button>

        {isPrimaryImage && (
          <>
            {/* Cursor-tracked glare highlight, part of the 3D tilt effect. */}
            <div
              className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-150"
              ref={tilt.glareRef}
            />

            {product?.id && (
              <button
                aria-label="Buy now"
                className="bg-primary text-primary-foreground absolute inset-x-4 bottom-4 z-20 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0"
                disabled={isOutOfStock || isBuyingNow}
                onClick={handleBuyNow}
                type="button"
              >
                <ZapIcon className="size-4" />
                {isBuyingNow ? 'Redirecting…' : 'Buy Now'}
              </button>
            )}
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: false }}>
          <CarouselContent>
            {gallery.map((item, i) => {
              if (typeof item.image !== 'object') return null

              return (
                <CarouselItem
                  className="basis-1/4 sm:basis-1/5"
                  key={`${item.image.id}-${i}`}
                  onClick={() => setCurrent(i)}
                >
                  <GridTileImage active={i === current} media={item.image} />
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>
      )}

      <Dialog onOpenChange={setLightboxOpen} open={lightboxOpen}>
        <DialogContent
          className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none sm:max-w-3xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Product image</DialogTitle>
          <DialogClose
            aria-label="Close"
            className="bg-background/90 absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full border shadow-sm"
          >
            <XIcon className="size-4" />
          </DialogClose>
          <div className="relative aspect-square w-full">
            <Media
              resource={gallery[current].image}
              className="h-full w-full"
              fill
              imgClassName="object-contain"
              size="(max-width: 640px) 100vw, 768px"
            />
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
