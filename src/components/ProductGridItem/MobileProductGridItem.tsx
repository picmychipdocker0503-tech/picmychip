'use client'

import type { Product } from '@/payload-types'

import { AddToCartButton } from '@/components/Cart/AddToCartButton'
import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
import { ProductMatchingImage } from '@/components/product/ProductMatchingImage'
import type { SkuStyle } from '@/lib/useSkuStyle'
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
  skuStyle?: SkuStyle
}

/**
 * Mobile's own sizing for the shop/category grid card — same layout and
 * actions as the desktop card, just tuned proportions (smaller image
 * badges, action icons, and type scale) for phone width. The quick-action
 * icons are always visible here (no hover state to reveal them on touch).
 * Same behavior as ProductGridItem — both consume useProductGridItemState,
 * so there's exactly one implementation of price/discount/stock/wishlist
 * logic behind the two.
 */
export const MobileProductGridItem: React.FC<Props> = ({
  product,
  averageRating,
  reviewCount,
  priority,
  skuStyle,
}) => {
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
    variantId,
    variantInventory,
  } = useProductGridItemState({ product })

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/75">
      <Link className="block" href={`/products/${slug}`}>
        <div className="relative w-full aspect-square overflow-hidden border-b border-border/60 bg-muted/15">
          <ProductMatchingImage category={firstCategory} className="w-full h-full" image={image} priority={priority} slug={slug} title={title} />

          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {stockBadge && (
              <span className="inline-flex items-center rounded-md bg-neutral-950/85 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                {stockBadge.label}
              </span>
            )}

            {isClearance ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-600/90 px-2 py-0.5 text-[9px] font-bold text-white">
                <TagIcon className="size-2" />
                CLEARANCE
              </span>
            ) : hasDiscount ? (
              <span className="bg-primary/90 text-primary-foreground inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold">
                {discountPercent > 0 ? `${discountPercent}% OFF` : 'SALE'}
              </span>
            ) : null}

            <span className="border-border/80 text-muted-foreground inline-flex items-center gap-1 rounded-md border bg-background/85 px-1.5 py-0.5 text-[8px] font-bold">
              <ShieldCheck className="size-2 text-emerald-500" />
              SPEC VERIFIED
            </span>
          </div>

          {productId && (
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
              <button
                aria-label="Quick view"
                className="bg-card/90 border-border/80 text-foreground flex size-7 items-center justify-center rounded-lg border shadow-sm"
                onClick={handleQuickView}
                type="button"
              >
                <SearchIcon className="size-3" />
              </button>

              <button
                aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
                className={clsx(
                  'flex size-7 items-center justify-center rounded-lg border shadow-sm',
                  saved
                    ? 'border-primary text-primary bg-primary/10'
                    : 'bg-card/90 border-border/80 text-muted-foreground',
                )}
                onClick={handleToggleWishlist}
                type="button"
              >
                <HeartIcon className={clsx('size-3', saved && 'fill-current')} />
              </button>

              {flags.compareProducts && (
                <button
                  aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
                  className={clsx(
                    'flex size-7 items-center justify-center rounded-lg border shadow-sm',
                    comparing
                      ? 'border-primary text-primary bg-primary/10'
                      : 'bg-card/90 border-border/80 text-muted-foreground',
                  )}
                  onClick={handleToggleCompare}
                  type="button"
                >
                  {comparing ? <CheckIcon className="size-3 text-primary" /> : <ScaleIcon className="size-3" />}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="text-foreground mb-1 line-clamp-2 min-h-[2.5rem] text-xs font-bold leading-snug [text-wrap:pretty]">
            {title}
          </div>

          {skuStyle?.show && product.sku && (
            <p className="text-[10px] font-bold mb-1" style={{ color: skuStyle.textColor }}>
              SKU: {product.sku}
            </p>
          )}

          {typeof averageRating === 'number' && reviewCount ? (
            <div className="mb-1.5 flex items-center gap-1">
              <RatingStars rating={averageRating} size="xs" />
              <span className="text-muted-foreground text-[10px]">({reviewCount})</span>
            </div>
          ) : null}

          {typeof displayPrice === 'number' && (
            <div className="flex items-baseline gap-1.5">
              {hasDiscount && typeof strikethroughPrice === 'number' && (
                <span className="text-muted-foreground text-[11px] line-through">
                  <Price amount={strikethroughPrice} />
                </span>
              )}
              <span className={clsx('text-sm font-extrabold tracking-tight', hasDiscount ? 'text-primary' : 'text-foreground')}>
                <Price amount={displayPrice} />
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="border-border/60 flex items-center justify-between gap-2 border-t px-3 pt-1.5 pb-3">
        {stockStatus && stockStatus !== 'in-stock' ? (
          <div className="flex items-center gap-1 text-[10px] font-medium">
            <span className={`size-1.5 rounded-full ${stockInfo.dot}`} />
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
