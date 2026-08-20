'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useQuickView } from '@/providers/QuickView'
import { useWishlist } from '@/providers/Wishlist'
import { getClientSideURL } from '@/utilities/getURL'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckIcon, HeartIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const QuickViewModal: React.FC = () => {
  const { product, close } = useQuickView()

  return (
    <Dialog onOpenChange={(open) => !open && close()} open={Boolean(product)}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogTitle className="sr-only">{product?.title}</DialogTitle>
        {product && <QuickViewBody product={product} />}
      </DialogContent>
    </Dialog>
  )
}

const QuickViewBody: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem, isLoading } = useCart()
  const { currency } = useCurrency()
  const { toggle: toggleWishlist, isSaved } = useWishlist()
  const [quantity, setQuantity] = useState(1)
  const [current, setCurrent] = useState(0)
  const [justAdded, setJustAdded] = useState(false)
  const [ratingInfo, setRatingInfo] = useState<{ average: number; count: number }>({
    average: 0,
    count: 0,
  })

  const productId = String(product.id)
  const saved = isSaved(productId)
  const priceField = `priceIn${currency.code}` as keyof Product
  const compareAtPriceField = `compareAtPriceIn${currency.code}` as keyof Product

  const price = product[priceField] as number | null | undefined
  const compareAtPrice = product[compareAtPriceField] as number | null | undefined
  const hasDiscount = typeof compareAtPrice === 'number' && typeof price === 'number' && compareAtPrice > price
  const discountPercent = hasDiscount ? Math.round((1 - price! / compareAtPrice!) * 100) : 0

  const gallery = product.gallery?.filter((item) => typeof item.image === 'object') ?? []
  const description = richTextToPlainText(product.description)

  useEffect(() => {
    setQuantity(1)
    setCurrent(0)

    fetch(
      `${getClientSideURL()}/api/reviews?where[product][equals]=${product.id}&where[status][equals]=approved&limit=200&depth=0`,
    )
      .then((res) => res.json())
      .then((data) => {
        const docs: { rating: number }[] = data?.docs ?? []
        const count = docs.length
        const average = count ? docs.reduce((sum, review) => sum + review.rating, 0) / count : 0
        setRatingInfo({ average, count })
      })
      .catch(() => {})
  }, [product.id])

  const isOutOfStock = product.stockStatus === 'out-of-stock'

  const handleAddToCart = () => {
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1500)

    addItem({ product: product.id }, quantity).then(() => {
      toast.success('Item added to cart.')
    })
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <div className="bg-muted relative mb-3 aspect-square overflow-hidden rounded-xl">
          {gallery[current]?.image && typeof gallery[current].image === 'object' ? (
            <Media
              className="relative h-full w-full"
              fill
              imgClassName="object-contain"
              resource={gallery[current].image}
              size="(max-width: 640px) 100vw, 384px"
            />
          ) : null}
        </div>
        {gallery.length > 1 && (
          <div className="flex gap-2">
            {gallery.map((item, index) => (
              <button
                className={`bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg border-2 ${index === current ? 'border-primary' : 'border-transparent'}`}
                key={item.id ?? index}
                onClick={() => setCurrent(index)}
                type="button"
              >
                {typeof item.image === 'object' && (
                  <Media
                    className="relative h-full w-full"
                    fill
                    imgClassName="object-contain"
                    resource={item.image}
                    size="56px"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {hasDiscount && (
          <span className="bg-success/15 text-success w-fit rounded-full px-3 py-1 text-xs font-bold">
            SALE {discountPercent}% OFF
          </span>
        )}

        <h2 className="text-2xl font-bold">{product.title}</h2>

        <div className="flex items-center gap-2 text-sm">
          {ratingInfo.count > 0 && (
            <>
              <RatingStars rating={ratingInfo.average} />
              <span className="text-muted-foreground">({ratingInfo.count} reviews)</span>
            </>
          )}
          <span
            className={`flex items-center gap-1 font-medium ${isOutOfStock ? 'text-error' : 'text-success'}`}
          >
            <CheckIcon className="size-3.5" />
            {isOutOfStock ? 'Out Of Stock' : 'In Stock'}
          </span>
        </div>

        {description && <p className="text-muted-foreground line-clamp-3 text-sm">{description}</p>}

        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">Price</p>
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-muted-foreground text-lg line-through">
                  <Price amount={compareAtPrice!} as="span" />
                </span>
              )}
              {typeof price === 'number' && (
                <span className="text-2xl font-bold">
                  <Price amount={price} as="span" />
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">Quantity</p>
            <div className="border-border flex items-center rounded-lg border">
              <button
                aria-label="Increase quantity"
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center"
                onClick={() => setQuantity((q) => q + 1)}
                type="button"
              >
                <PlusIcon className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <button
                aria-label="Decrease quantity"
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center disabled:opacity-40"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                type="button"
              >
                <MinusIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-3">
          <button
            className="btn btn-ghost flex-1 gap-2 border border-white/30 bg-white/10 text-foreground shadow-md backdrop-blur-md backdrop-saturate-150 hover:border-white/40 hover:bg-white/20"
            disabled={isOutOfStock || isLoading}
            onClick={handleAddToCart}
            type="button"
          >
            {!isOutOfStock && (justAdded ? <CheckIcon className="size-4" /> : <ShoppingCartIcon className="size-4" />)}
            {isOutOfStock ? 'Out of Stock' : justAdded ? 'Added' : 'Add to Cart'}
          </button>
          <button
            className={`btn flex-1 gap-2 ${saved ? 'btn-primary' : 'btn-neutral'}`}
            onClick={() => toggleWishlist(productId)}
            type="button"
          >
            <HeartIcon className={saved ? 'size-4 fill-current' : 'size-4'} />
            {saved ? 'In Wishlist' : 'Add to Wishlist'}
          </button>
        </div>

        <Link className="text-primary mt-1 text-sm font-medium hover:underline" href={`/products/${product.slug}`}>
          View full details →
        </Link>
      </div>
    </div>
  )
}
