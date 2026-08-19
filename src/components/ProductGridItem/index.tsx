'use client'

import type { Product } from '@/payload-types'

import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
import { ProductMatchingImage } from '@/components/product/ProductMatchingImage'
import { useTilt3D } from '@/lib/useTilt3D'
import { useCompare } from '@/providers/Compare'
import { useQuickView } from '@/providers/QuickView'
import { useWishlist } from '@/providers/Wishlist'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { CheckIcon, HeartIcon, ScaleIcon, SearchIcon, ShoppingCartIcon, ShieldCheck, TagIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  product: Partial<Product>
  averageRating?: number
  reviewCount?: number
  priority?: boolean
}

const STOCK_BADGE = {
  'low-stock': { label: 'Low Stock', variant: 'warning' as const },
  'out-of-stock': { label: 'Out of Stock', variant: 'destructive' as const },
  backorder: { label: 'Backorder', variant: 'warning' as const },
}

const STOCK_LABEL: Record<string, { label: string; className: string; dot: string }> = {
  'in-stock': { label: 'In Stock', className: 'text-emerald-500', dot: 'bg-emerald-500' },
  'low-stock': { label: 'Low Stock', className: 'text-amber-500', dot: 'bg-amber-500' },
  'out-of-stock': { label: 'Out of Stock', className: 'text-red-500', dot: 'bg-red-500' },
  backorder: { label: 'Backorder', className: 'text-amber-500', dot: 'bg-amber-500' },
}

export const ProductGridItem: React.FC<Props> = ({ product, averageRating, reviewCount, priority }) => {
  const { gallery, title, stockStatus, slug, categories } = product
  const { toggle, isComparing } = useCompare()
  const { toggle: toggleWishlist, isSaved } = useWishlist()
  const { open: openQuickView } = useQuickView()
  const { addItem, isLoading } = useCart()
  const { currency } = useCurrency()
  const [justAdded, setJustAdded] = useState(false)
  const tilt = useTilt3D<HTMLDivElement>()

  const priceField = `priceIn${currency.code}` as keyof Product
  const compareAtPriceField = `compareAtPriceIn${currency.code}` as keyof Product
  const salePriceField = `salePriceIn${currency.code}` as keyof Product

  const stockBadge =
    stockStatus && stockStatus in STOCK_BADGE
      ? STOCK_BADGE[stockStatus as keyof typeof STOCK_BADGE]
      : undefined
  const stockInfo = STOCK_LABEL[stockStatus ?? 'in-stock'] ?? STOCK_LABEL['in-stock']
  const isOutOfStock = stockStatus === 'out-of-stock'

  let price = product[priceField] as number | null | undefined
  const compareAtPrice = product[compareAtPriceField] as number | null | undefined
  const salePrice = product[salePriceField] as number | null | undefined

  const variants = product.variants?.docs
  const hasVariants = Boolean(variants && variants.length > 0)

  if (hasVariants) {
    const variant = variants![0]
    if (variant && typeof variant === 'object' && typeof variant[priceField as keyof typeof variant] === 'number') {
      price = variant[priceField as keyof typeof variant] as number
    }
  }

  // Sale/clearance pricing is product-level only (no per-variant override
  // yet), so it's only shown when the card isn't already displaying a
  // variant-specific price.
  const saleExpired = Boolean(product.saleEndDate && new Date(product.saleEndDate).getTime() < Date.now())
  const isOnSale = !hasVariants && Boolean(product.onSale) && !saleExpired && typeof salePrice === 'number'
  const isClearance = Boolean(product.isClearance)

  const hasDiscount =
    (isOnSale && typeof price === 'number' && salePrice! < price) ||
    (!hasVariants && typeof compareAtPrice === 'number' && typeof price === 'number' && compareAtPrice > price)

  const displayPrice = isOnSale ? salePrice! : price
  const strikethroughPrice = isOnSale ? price : hasDiscount ? compareAtPrice : undefined
  const discountPercent =
    isOnSale && typeof price === 'number' && price > 0
      ? Math.round((1 - salePrice! / price) * 100)
      : hasDiscount && typeof compareAtPrice === 'number' && typeof price === 'number' && compareAtPrice > 0
        ? Math.round((1 - price / compareAtPrice) * 100)
        : 0

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  const productId = product.id ? String(product.id) : undefined
  const comparing = productId ? isComparing(productId) : false
  const saved = productId ? isSaved(productId) : false

  const firstVariant = variants && variants.length > 0 ? variants[0] : undefined
  const variantId = firstVariant && typeof firstVariant === 'object' ? firstVariant.id : undefined

  const firstCategory = Array.isArray(categories) && categories[0] ? categories[0] : undefined

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!product.id) return

    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1500)

    addItem({ product: product.id, variant: variantId }).then(() => {
      toast.success('Added to sourcing cart.')
    })
  }

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${slug}`}>
      <div className="relative flex flex-col justify-between h-full rounded-3xl border border-border/80 bg-card/75 backdrop-blur-xl transition-all duration-300 hover:border-primary/60 hover:bg-card hover:shadow-xl hover:shadow-primary/10 overflow-hidden">

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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openQuickView(product as Product)
                }}
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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleWishlist(productId)
                }}
                type="button"
              >
                <HeartIcon className={clsx('size-3.5', saved && 'fill-current')} />
              </button>

              <button
                aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
                className={clsx(
                  'flex size-8 items-center justify-center rounded-xl border backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer',
                  comparing
                    ? 'border-primary text-primary bg-primary/10'
                    : 'bg-card/90 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card',
                )}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggle(productId)
                }}
                type="button"
              >
                {comparing ? <CheckIcon className="size-3.5 text-primary" /> : <ScaleIcon className="size-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-5 flex flex-col justify-between flex-1 gap-3">
          <div>
            <div className="font-bold text-sm text-foreground mb-1.5 line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors leading-snug">
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

          {/* Sourcing / Stock Status & Action */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              <span className={`size-1.5 rounded-full ${stockInfo.dot} animate-pulse`} />
              <span className={stockInfo.className}>{stockInfo.label}</span>
            </div>

            <button
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-bold transition-all shadow-md shadow-primary/15 disabled:opacity-50 cursor-pointer"
              disabled={isLoading || isOutOfStock}
              onClick={handleAddToCart}
              type="button"
            >
              {justAdded ? <CheckIcon className="size-3.5" /> : <ShoppingCartIcon className="size-3.5" />}
              <span>{justAdded ? 'Added' : 'Add'}</span>
            </button>
          </div>
        </div>

      </div>
    </Link>
  )
}
