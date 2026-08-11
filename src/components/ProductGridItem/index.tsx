'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
import { Badge } from '@/components/ui/badge'
import { useCompare } from '@/providers/Compare'
import { useQuickView } from '@/providers/QuickView'
import { useWishlist } from '@/providers/Wishlist'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { CheckIcon, HeartIcon, ScaleIcon, SearchIcon, ShoppingCartIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  product: Partial<Product>
  averageRating?: number
  reviewCount?: number
}

const STOCK_BADGE = {
  'low-stock': { label: 'Low Stock', variant: 'warning' as const },
  'out-of-stock': { label: 'Out of Stock', variant: 'destructive' as const },
  backorder: { label: 'Backorder', variant: 'warning' as const },
}

const STOCK_LABEL: Record<string, { label: string; className: string }> = {
  'in-stock': { label: 'In Stock', className: 'text-success' },
  'low-stock': { label: 'Low Stock', className: 'text-warning' },
  'out-of-stock': { label: 'Out of Stock', className: 'text-error' },
  backorder: { label: 'Backorder', className: 'text-warning' },
}

export const ProductGridItem: React.FC<Props> = ({ product, averageRating, reviewCount }) => {
  const { gallery, title, stockStatus } = product
  const { toggle, isComparing } = useCompare()
  const { toggle: toggleWishlist, isSaved } = useWishlist()
  const { open: openQuickView } = useQuickView()
  const { addItem, isLoading } = useCart()
  const { currency } = useCurrency()
  const [justAdded, setJustAdded] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const priceField = `priceIn${currency.code}` as keyof Product
  const compareAtPriceField = `compareAtPriceIn${currency.code}` as keyof Product

  const stockBadge = stockStatus && stockStatus in STOCK_BADGE ? STOCK_BADGE[stockStatus as keyof typeof STOCK_BADGE] : undefined
  const stockInfo = STOCK_LABEL[stockStatus ?? 'in-stock'] ?? STOCK_LABEL['in-stock']
  const isOutOfStock = stockStatus === 'out-of-stock'

  let price = product[priceField] as number | null | undefined
  const compareAtPrice = product[compareAtPriceField] as number | null | undefined

  const hasDiscount = typeof compareAtPrice === 'number' && typeof price === 'number' && compareAtPrice > price
  const discountPercent = hasDiscount ? Math.round((1 - price! / compareAtPrice!) * 100) : 0

  const variants = product.variants?.docs

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (variant && typeof variant === 'object' && typeof variant[priceField as keyof typeof variant] === 'number') {
      price = variant[priceField as keyof typeof variant] as number
    }
  }

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  const productId = product.id ? String(product.id) : undefined
  const comparing = productId ? isComparing(productId) : false
  const saved = productId ? isSaved(productId) : false

  const firstVariant = variants && variants.length > 0 ? variants[0] : undefined
  const variantId = firstVariant && typeof firstVariant === 'object' ? firstVariant.id : undefined

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!product.id) return

    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1500)

    addItem({ product: product.id, variant: variantId }).then(() => {
      toast.success('Item added to cart.')
    })
  }

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${product.slug}`}>
      <div className="card-hover bg-card rounded-2xl border border-border overflow-hidden">
        {image ? (
          <div className="relative aspect-square bg-primary-foreground">
            <Media
              className={clsx(
                'relative aspect-square object-cover',
              )}
              height={80}
              imgClassName={clsx('h-full w-full object-cover', {
                'transition duration-300 ease-in-out group-hover:scale-105': true,
              })}
              resource={image}
              width={80}
            />
          </div>
        ) : (
          <div className="aspect-square bg-muted/30 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}

        {stockBadge ? (
          <Badge variant={stockBadge.variant} className="absolute top-3 left-3 shadow-sm">
            {stockBadge.label}
          </Badge>
        ) : (
          hasDiscount && (
            <Badge className="absolute top-3 left-3 shadow-sm">{discountPercent}% OFF</Badge>
          )
        )}

        {productId && (
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
            <button
              aria-label="Quick view"
              className="bg-background/90 flex size-8 items-center justify-center rounded-full border backdrop-blur-sm shadow-sm transition-all duration-200 hover:bg-background hover:scale-110 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                openQuickView(product as Product)
              }}
              type="button"
            >
              <SearchIcon className="size-4" />
            </button>

            <button
              aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
              className={clsx(
                'bg-background/90 flex size-8 items-center justify-center rounded-full border backdrop-blur-sm shadow-sm transition-all duration-200 hover:bg-background hover:scale-110',
                saved ? 'border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!saved) {
                  setJustSaved(true)
                  window.setTimeout(() => setJustSaved(false), 350)
                }
                toggleWishlist(productId)
              }}
              type="button"
            >
              <HeartIcon
                className={clsx(
                  'size-4',
                  saved && 'fill-current',
                  justSaved && 'animate-in zoom-in-75 duration-300',
                )}
              />
            </button>

            <button
              aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
              className={clsx(
                'bg-background/90 flex size-8 items-center justify-center rounded-full border backdrop-blur-sm shadow-sm transition-all duration-200 hover:bg-background hover:scale-110',
                comparing ? 'border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggle(productId)
              }}
              type="button"
            >
              {comparing ? <CheckIcon className="size-4" /> : <ScaleIcon className="size-4" />}
            </button>
          </div>
        )}

        <div className="p-5">
          <div className="font-medium text-foreground mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {title}
          </div>

          {typeof averageRating === 'number' && reviewCount ? (
            <div className="mb-2 flex items-center gap-1.5">
              <RatingStars rating={averageRating} size="xs" />
              <span className="text-muted-foreground text-xs">({reviewCount})</span>
            </div>
          ) : null}

          {typeof price === 'number' && (
            <div className="mb-3 flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-muted-foreground text-sm line-through">
                  <Price amount={compareAtPrice!} />
                </span>
              )}
              <span className={clsx('text-lg font-semibold', hasDiscount ? 'text-primary' : 'text-foreground')}>
                <Price amount={price} />
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-medium ${stockInfo.className}`}>{stockInfo.label}</span>
            <button
              className={clsx(
                'bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2',
                justAdded && 'scale-105',
              )}
              disabled={isLoading || isOutOfStock}
              onClick={handleAddToCart}
              type="button"
            >
              {justAdded ? (
                <CheckIcon className="w-4 h-4 animate-in zoom-in-50 duration-300" key="added" />
              ) : (
                <ShoppingCartIcon className="w-4 h-4" key="cart" />
              )}
              <span className="hidden sm:inline">{justAdded ? 'Added' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
