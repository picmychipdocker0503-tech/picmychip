'use client'

import type { Product } from '@/payload-types'

import { AddToCartButton } from '@/components/Cart/AddToCartButton'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
import type { SkuStyle } from '@/lib/useSkuStyle'
import clsx from 'clsx'
import { CheckIcon, HeartIcon, SearchIcon, ShoppingCartIcon, TagIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useDealProductCardState } from './useDealProductCardState'

type Props = {
  product: Partial<Product>
  averageRating?: number
  reviewCount?: number
  priority?: boolean
  skuStyle?: SkuStyle
}

/**
 * Mobile's own sizing for the deal-carousel card — tighter padding, a
 * smaller image, and smaller type than the desktop card, with the quick
 * action icons always visible (no hover state to reveal them on touch).
 * Same behavior as DealProductCard — both consume useDealProductCardState,
 * so there's exactly one implementation of price/discount/cart/wishlist
 * logic behind the two.
 */
export const MobileDealProductCard: React.FC<Props> = ({
  product,
  averageRating,
  reviewCount,
  priority,
  skuStyle,
}) => {
  const {
    displayPrice,
    discountPercent,
    handleAddToCart,
    handleQuickView,
    handleToggleWishlist,
    hasDiscount,
    image,
    isAdding,
    isClearance,
    isOutOfStock,
    justAdded,
    saved,
    stockInfo,
    strikethroughPrice,
    tilt,
  } = useDealProductCardState({ product, averageRating, reviewCount })

  return (
    <div className="group bg-card border-border relative flex h-full flex-col items-center gap-2 rounded-xl border p-3 text-center">
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
        <button
          aria-label="Quick view"
          className="bg-background text-muted-foreground flex size-7 items-center justify-center rounded-full shadow-sm"
          onClick={handleQuickView}
          type="button"
        >
          <SearchIcon className="size-3.5" />
        </button>

        <button
          aria-label="Add to cart"
          className="bg-background text-muted-foreground flex size-7 items-center justify-center rounded-full shadow-sm disabled:opacity-50"
          disabled={isOutOfStock || isAdding}
          onClick={handleAddToCart}
          type="button"
        >
          {justAdded ? <CheckIcon className="size-3.5" /> : <ShoppingCartIcon className="size-3.5" />}
        </button>

        <button
          aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
          className={clsx(
            'bg-background flex size-7 items-center justify-center rounded-full shadow-sm',
            saved ? 'text-primary' : 'text-muted-foreground',
          )}
          onClick={handleToggleWishlist}
          type="button"
        >
          <HeartIcon className={clsx('size-3.5', saved && 'fill-current')} />
        </button>
      </div>

      <Link className="flex w-full flex-col items-center gap-2" href={`/products/${product.slug}`}>
        <h3 className="text-foreground line-clamp-2 min-h-[2.5rem] text-sm font-semibold [text-wrap:pretty]">
          {product.title}
        </h3>

        {skuStyle?.show && product.sku && (
          <p className="text-[11px] font-bold" style={{ color: skuStyle.textColor }}>
            SKU: {product.sku}
          </p>
        )}

        {typeof averageRating === 'number' && reviewCount ? (
          <div className="flex items-center gap-1">
            <RatingStars rating={averageRating} size="xs" />
            <span className="text-muted-foreground text-[11px]">({reviewCount})</span>
          </div>
        ) : null}

        <div className="flex items-baseline justify-center gap-1.5">
          {typeof displayPrice === 'number' && (
            <span className="text-foreground text-base font-bold">
              <Price amount={displayPrice} as="span" />
            </span>
          )}
          {hasDiscount && typeof strikethroughPrice === 'number' && (
            <span className="text-muted-foreground text-xs line-through">
              <Price amount={strikethroughPrice} as="span" />
            </span>
          )}
        </div>

        <div
          className="relative aspect-square w-full max-w-28 will-change-transform"
          onMouseEnter={tilt.onMouseEnter}
          onMouseLeave={tilt.onMouseLeave}
          onMouseMove={tilt.onMouseMove}
          ref={tilt.ref}
        >
          {isClearance ? (
            <span className="absolute top-0 left-0 z-20 inline-flex items-center gap-1 rounded-md bg-amber-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
              <TagIcon className="size-2" />
              CLEARANCE
            </span>
          ) : hasDiscount ? (
            <span className="bg-primary/90 text-primary-foreground absolute top-0 left-0 z-20 inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold">
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
              size="35vw"
            />
          ) : (
            <div className="bg-background/50 flex h-full w-full items-center justify-center rounded-lg text-xs text-muted-foreground">
              No image
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-10 rounded-lg opacity-0" ref={tilt.glareRef} />
        </div>
      </Link>

      <div className="mt-0.5 flex w-full items-center justify-between gap-2">
        {product.stockStatus && product.stockStatus !== 'in-stock' ? (
          <span className={`text-[11px] font-medium ${stockInfo.className}`}>{stockInfo.label}</span>
        ) : (
          <span />
        )}
        {product.id && <AddToCartButton outOfStock={isOutOfStock} productId={product.id} />}
      </div>
    </div>
  )
}
