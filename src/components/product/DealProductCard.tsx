'use client'

import type { Product } from '@/payload-types'

import { AddToCartButton } from '@/components/Cart/AddToCartButton'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
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
}

export const DealProductCard: React.FC<Props> = ({ product, averageRating, reviewCount, priority }) => {
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
    <div className="group bg-card border-border relative flex h-full flex-col items-center gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-6 text-center transition-colors duration-250 hover:border-primary">
      <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <button
          aria-label="Quick view"
          className="group bg-background text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110"
          onClick={handleQuickView}
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
          onClick={handleToggleWishlist}
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
