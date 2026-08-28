'use client'

import type { Product } from '@/payload-types'

import { AddToCartButton } from '@/components/Cart/AddToCartButton'
import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
import { ProductMatchingImage } from '@/components/product/ProductMatchingImage'
import clsx from 'clsx'
import { CheckIcon, HeartIcon, ScaleIcon, SearchIcon, ShieldCheck, TagIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useProductGridItemState } from './useProductGridItemState'

type Props = {
  product: Partial<Product>
  averageRating?: number
  reviewCount?: number
  priority?: boolean
}

export const ProductGridItem: React.FC<Props> = ({ product, averageRating, reviewCount, priority }) => {
  const { title, slug, stockStatus } = product
  const {
    comparing,
    discountPercent,
    displayPrice,
    firstCategory,
    flags,
    handleQuickView,
    handleToggleCompare,
    handleToggleWishlist,
    hasDiscount,
    hasVariants,
    image,
    isClearance,
    isOutOfStock,
    productId,
    saved,
    stockBadge,
    stockInfo,
    strikethroughPrice,
    tilt,
    variantId,
    variantInventory,
  } = useProductGridItemState({ product })

  return (
    <div className="group relative flex h-full w-full flex-col justify-between rounded-3xl border border-border/80 bg-card/75 backdrop-blur-xl transition-all duration-300 hover:border-primary/60 hover:bg-card hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
      {/* Only the media + title/price are inside the Link — the action row
          below (with AddToCartButton) is a sibling, not nested inside it.
          A <button> nested inside an <a> is invalid HTML, and made clicks
          on Add to cart unreliably fall through to the card's own link
          navigation instead of adding the item. */}
      <Link className="block" href={`/products/${slug}`}>
        {/* Top Media Container: Strictly square and uniform dimensions. 3D tilt lives here, on the image, not the whole card. */}
        <div
          className="relative w-full aspect-square overflow-hidden border-b border-border/60 bg-muted/15 transition-transform duration-150 ease-out will-change-transform"
          onMouseEnter={tilt.onMouseEnter}
          onMouseLeave={tilt.onMouseLeave}
          onMouseMove={tilt.onMouseMove}
          ref={tilt.ref}
        >
          <ProductMatchingImage
            category={firstCategory}
            className="w-full h-full"
            image={image}
            priority={priority}
            slug={slug}
            title={title}
          />

          {/* Cursor-tracked glare highlight, part of the 3D tilt effect. */}
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-150"
            ref={tilt.glareRef}
          />

          {/* Holographic Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {stockBadge && (
              <span className="inline-flex items-center rounded-lg bg-neutral-950/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/30 shadow-sm">
                {stockBadge.label}
              </span>
            )}

            {isClearance ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-600/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                <TagIcon className="size-2.5" />
                CLEARANCE
              </span>
            ) : hasDiscount ? (
              <span className="inline-flex items-center rounded-lg bg-primary/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                {discountPercent > 0 ? `${discountPercent}% OFF` : 'SALE'}
              </span>
            ) : null}

            <span className="inline-flex items-center gap-1 rounded-lg bg-background/85 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-muted-foreground border border-border/80">
              <ShieldCheck className="size-2.5 text-emerald-500" />
              SPEC VERIFIED
            </span>
          </div>

          {/* Quick Action Overlay Icons — visible by default on mobile (no
              hover state to reveal them via touch), hover-gated on md+. */}
          {productId && (
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 z-10">
              <button
                aria-label="Quick view"
                className="bg-card/90 flex size-8 items-center justify-center rounded-xl border border-border/80 backdrop-blur-md shadow-sm transition-all duration-200 hover:bg-primary hover:text-primary-foreground text-foreground cursor-pointer"
                onClick={handleQuickView}
                type="button"
              >
                <SearchIcon className="size-3.5" />
              </button>

              <button
                aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
                className={clsx(
                  'flex size-8 items-center justify-center rounded-xl border backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer',
                  saved
                    ? 'border-primary text-primary bg-primary/10'
                    : 'bg-card/90 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card',
                )}
                onClick={handleToggleWishlist}
                type="button"
              >
                <HeartIcon className={clsx('size-3.5', saved && 'fill-current')} />
              </button>

              {flags.compareProducts && (
                <button
                  aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
                  className={clsx(
                    'flex size-8 items-center justify-center rounded-xl border backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer',
                    comparing
                      ? 'border-primary text-primary bg-primary/10'
                      : 'bg-card/90 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card',
                  )}
                  onClick={handleToggleCompare}
                  type="button"
                >
                  {comparing ? <CheckIcon className="size-3.5 text-primary" /> : <ScaleIcon className="size-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-5">
          <div className="font-bold text-sm text-foreground mb-1.5 line-clamp-3 min-h-[3.75rem] group-hover:text-primary transition-colors leading-snug [text-wrap:pretty]">
            {title}
          </div>

          {typeof averageRating === 'number' && reviewCount ? (
            <div className="mb-2 flex items-center gap-1.5">
              <RatingStars rating={averageRating} size="xs" />
              <span className="text-muted-foreground text-[11px]">({reviewCount})</span>
            </div>
          ) : null}

          {typeof displayPrice === 'number' && (
            <div className="flex items-baseline gap-2">
              {hasDiscount && typeof strikethroughPrice === 'number' && (
                <span className="text-muted-foreground text-xs line-through">
                  <Price amount={strikethroughPrice} />
                </span>
              )}
              <span className={clsx('text-base sm:text-lg font-extrabold tracking-tight', hasDiscount ? 'text-primary' : 'text-foreground')}>
                <Price amount={displayPrice} />
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Sourcing / Stock Status & Action — outside the Link above (see note there). */}
      <div className="px-5 pb-5 pt-2 border-t border-border/60 flex items-center justify-between gap-2">
        {stockStatus && stockStatus !== 'in-stock' ? (
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <span className={`size-1.5 rounded-full ${stockInfo.dot} animate-pulse`} />
            <span className={stockInfo.className}>{stockInfo.label}</span>
          </div>
        ) : (
          <span />
        )}

        {product.id && (
          <AddToCartButton
            outOfStock={isOutOfStock}
            inventory={hasVariants ? variantInventory : product.inventory}
            productId={product.id}
            variantId={variantId}
          />
        )}
      </div>
    </div>
  )
}
