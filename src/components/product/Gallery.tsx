'use client'

import type { Product, Variant } from '@/payload-types'

import { Media } from '@/components/Media'
import { GridTileImage } from '@/components/Grid/tile'
import { ProtectedZoomableImage } from '@/components/product/ProtectedZoomableImage'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useTilt3D } from '@/lib/useTilt3D'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { XIcon, ZapIcon, ZoomInIcon } from 'lucide-react'
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

  const currentImage = gallery[current]?.image
  const currentImageObject = typeof currentImage === 'object' ? currentImage : undefined

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
          aria-label="Show image"
          className="border-border bg-transparent relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border"
          onClick={() => setLightboxOpen(true)}
          type="button"
        >
          {/* What's actually seen — the clean, undisturbed original.
              Viewing/browsing shows no watermark at all. */}
          <Media
            resource={currentImageObject}
            className="relative h-full w-full"
            fill
            imgClassName="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
            priority={isPrimaryImage}
            size="(max-width: 1024px) 100vw, 50vw"
          />
          {/* Invisible (opacity-0) and stacked on top — invisible so the
              clean photo above is all that's visually seen, but a browser's
              right-click hit-tests whichever element is topmost, so "Save
              image as" / "Copy image" land on THIS element and download the
              watermarked file instead of the clean one behind it. Right-click
              itself is deliberately left enabled (no onContextMenu block) —
              the point is for it to work normally and just resolve to the
              watermarked copy. */}
          {currentImageObject && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain p-6 opacity-0"
              loading="eager"
              src={`/api/media/watermark/${currentImageObject.id}`}
            />
          )}
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
          // Overriding the base dialog's zoom-in-95/zoom-out-95 open/close
          // animation to a no-op (100% — i.e. no scale change) — that pop
          // effect combined with the backdrop dimming the rest of the page
          // read as "the whole page zoomed", which is exactly what this
          // modal exists to avoid. Only the fade animation is kept.
          className="max-w-[calc(100%-2rem)] border-none bg-background p-4 shadow-lg data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 sm:max-w-3xl sm:p-6 lg:max-w-5xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Product image</DialogTitle>
          <DialogClose
            aria-label="Close"
            className="bg-background/90 absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full border shadow-sm"
          >
            <XIcon className="size-4" />
          </DialogClose>

          {/* Amazon-style layout: large zoomable image on the left, every
              gallery image as a clickable thumbnail grid on the right — no
              prev/next arrows needed since any thumbnail is one click away. */}
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="lg:basis-2/3">
              {currentImageObject && (
                <ProtectedZoomableImage
                  alt={currentImageObject.alt || ''}
                  key={currentImageObject.id}
                  mediaId={currentImageObject.id}
                  showDownloadButton={false}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  src={currentImageObject.url || ''}
                />
              )}
            </div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-3 lg:basis-1/3 lg:grid-cols-3 lg:content-start">
                {gallery.map((item, i) => {
                  if (typeof item.image !== 'object' || !item.image) return null

                  return (
                    <button
                      aria-label={`Show image ${i + 1}`}
                      className="aspect-square"
                      key={`${item.image.id}-${i}`}
                      onClick={() => setCurrent(i)}
                      type="button"
                    >
                      <GridTileImage active={i === current} media={item.image} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
