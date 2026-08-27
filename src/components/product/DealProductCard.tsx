'use client'

import type { Product } from '@/payload-types'

import { AddToCartButton } from '@/components/Cart/AddToCartButton'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
import { useTilt3D } from '@/lib/useTilt3D'
import { useCartDrawer } from '@/providers/CartDrawer'
import { useQuickView } from '@/providers/QuickView'
import { useWishlist } from '@/providers/Wishlist'
import { useWishlistPopover } from '@/providers/WishlistPopover'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { CheckIcon, HeartIcon, SearchIcon, ShoppingCartIcon, TagIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

type Props = {
  product: Partial<Product>
  averageRating?: number
  reviewCount?: number
  priority?: boolean
}

const STOCK_LABEL: Record<string, { label: string; className: string }> = {
  'in-stock': { label: 'In Stock', className: 'text-success' },
  'out-of-stock': { label: 'Out of Stock', className: 'text-error' },
  'low-stock': { label: 'Low Stock', className: 'text-warning' },
  backorder: { label: 'Backorder', className: 'text-warning' },
}

export const DealProductCard: React.FC<Props> = ({ product, averageRating, reviewCount, priority }) => {
  const { currency } = useCurrency()
  const { open } = useQuickView()
  const { toggle: toggleWishlist, isSaved } = useWishlist()
  const { showWishlistPopover } = useWishlistPopover()
  // `isLoading` from useCart() is one shared flag for the whole cart, not
  // per-card — using it here would disable every other product's quick-add
  // button on the page while any one add request is in flight.
  const { addItem } = useCart()
  const { showMiniCart } = useCartDrawer()
  const [justAdded, setJustAdded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const tilt = useTilt3D<HTMLDivElement>()

  const priceField = `priceIn${currency.code}` as keyof Product
  const compareAtPriceField = `compareAtPriceIn${currency.code}` as keyof Product
  const salePriceField = `salePriceIn${currency.code}` as keyof Product

  // Read-only display logic — the underlying price/compareAtPrice/salePrice
  // fields and their values are never touched here, only how they're shown.
  const price = product[priceField] as number | null | undefined
  const compareAtPrice = product[compareAtPriceField] as number | null | undefined
  const salePrice = product[salePriceField] as number | null | undefined

  const saleExpired = Boolean(product.saleEndDate && new Date(product.saleEndDate).getTime() < Date.now())
  const isOnSale = Boolean(product.onSale) && !saleExpired && typeof salePrice === 'number'
  const isClearance = Boolean(product.isClearance)

  const hasDiscount =
    (isOnSale && typeof price === 'number' && salePrice! < price) ||
    (typeof compareAtPrice === 'number' && typeof price === 'number' && compareAtPrice > price)

  const displayPrice = isOnSale ? salePrice! : price
  const strikethroughPrice = isOnSale ? price : hasDiscount ? compareAtPrice : undefined
  const discountPercent =
    isOnSale && typeof price === 'number' && price > 0 ? Math.round((1 - salePrice! / price) * 100) : 0

  const stockInfo = STOCK_LABEL[product.stockStatus ?? 'in-stock'] ?? STOCK_LABEL['in-stock']
  const isOutOfStock = product.stockStatus === 'out-of-stock'

  const image = product.gallery?.[0]?.image && typeof product.gallery[0]?.image !== 'string' ? product.gallery[0]?.image : false

  const productId = product.id ? String(product.id) : undefined
  const saved = productId ? isSaved(productId) : false

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!product.id) return

    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1500)

    setIsAdding(true)
    addItem({ product: product.id })
      .then(() => {
        showMiniCart()
      })
      .finally(() => setIsAdding(false))
  }

  return (
    <div className="group bg-card border-border relative flex h-full flex-col items-center gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-6 text-center transition-colors duration-250 hover:border-primary">
      <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <button
          aria-label="Quick view"
          className="group bg-background text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110"
          onClick={(e) => {
            e.preventDefault()
            if (product.id) open(product as Product)
          }}
          type="button"
        >
          <SearchIcon className="pmc-icon-anim size-4 group-hover:animate-[pmc-icon-tilt_0.5s_ease-in-out]" />
        </button>

        <button
          aria-label="Add to cart"
          className="group bg-background text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110 disabled:opacity-50"
          disabled={isOutOfStock || isAdding}
          onClick={handleAddToCart}
          type="button"
        >
          {justAdded ? (
            <CheckIcon className="size-4" />
          ) : (
            <ShoppingCartIcon className="pmc-icon-anim size-4 group-hover:animate-[pmc-icon-nudge-up_0.5s_ease-in-out]" />
          )}
        </button>

        <button
          aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
          className={clsx(
            'group bg-background flex size-9 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110',
            saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={(e) => {
            e.preventDefault()
            if (productId) {
              if (!saved) showWishlistPopover(product as Product)
              toggleWishlist(productId)
            }
          }}
          type="button"
        >
          <HeartIcon
            className={clsx(
              'pmc-icon-anim size-4 group-hover:animate-[pmc-icon-pop_0.5s_ease-in-out]',
              saved && 'fill-current',
            )}
          />
        </button>
      </div>

      <Link className="flex w-full flex-col items-center gap-3" href={`/products/${product.slug}`}>
        <h3 className="text-foreground line-clamp-3 min-h-[4rem] font-semibold [text-wrap:pretty]">
          {product.title}
        </h3>

        {typeof averageRating === 'number' && reviewCount ? (
          <div className="flex items-center gap-1.5">
            <RatingStars rating={averageRating} size="xs" />
            <span className="text-muted-foreground text-xs">({reviewCount})</span>
          </div>
        ) : null}

        <div className="flex items-baseline justify-center gap-2">
          {typeof displayPrice === 'number' && (
            <span className="text-foreground text-lg font-bold">
              <Price amount={displayPrice} as="span" />
            </span>
          )}
          {hasDiscount && typeof strikethroughPrice === 'number' && (
            <span className="text-muted-foreground text-sm line-through">
              <Price amount={strikethroughPrice} as="span" />
            </span>
          )}
        </div>

        <div
          className="relative aspect-square w-full max-w-40 transition-transform duration-150 ease-out will-change-transform"
          onMouseEnter={tilt.onMouseEnter}
          onMouseLeave={tilt.onMouseLeave}
          onMouseMove={tilt.onMouseMove}
          ref={tilt.ref}
        >
          {isClearance ? (
            <span className="absolute top-0 left-0 z-20 inline-flex items-center gap-1 rounded-lg bg-amber-600/90 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
              <TagIcon className="size-2.5" />
              CLEARANCE
            </span>
          ) : hasDiscount ? (
            <span className="bg-primary/90 text-primary-foreground absolute top-0 left-0 z-20 inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md">
              {discountPercent > 0 ? `${discountPercent}% OFF` : 'SALE'}
            </span>
          ) : null}

          {image ? (
            <Media
              className="relative h-full w-full"
              fill
              imgClassName="object-contain"
              priority={priority}
              resource={image}
              size="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className="bg-background/50 flex h-full w-full items-center justify-center rounded-lg text-xs text-muted-foreground">
              No image
            </div>
          )}

          {/* Cursor-tracked glare highlight, part of the 3D tilt effect. */}
          <div
            className="pointer-events-none absolute inset-0 z-10 rounded-lg opacity-0 transition-opacity duration-150"
            ref={tilt.glareRef}
          />
        </div>
      </Link>

      <div className="mt-1 flex w-full items-center justify-between gap-2">
        {product.stockStatus && product.stockStatus !== 'in-stock' ? (
          <span className={`text-xs font-medium ${stockInfo.className}`}>{stockInfo.label}</span>
        ) : (
          <span />
        )}
        {product.id && <AddToCartButton outOfStock={isOutOfStock} productId={product.id} />}
      </div>
    </div>
  )
}
