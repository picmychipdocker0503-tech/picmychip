import type { Product } from '@/payload-types'

import { useFeatureFlags } from '@/lib/useFeatureFlags'
import { useTilt3D } from '@/lib/useTilt3D'
import { useCompare } from '@/providers/Compare'
import { useQuickView } from '@/providers/QuickView'
import { useWishlist } from '@/providers/Wishlist'
import { useWishlistPopover } from '@/providers/WishlistPopover'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

type Props = {
  product: Partial<Product>
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

/**
 * All the derived state and handlers behind ProductGridItem — shared by the
 * desktop card and MobileProductGridItem so the two presentational
 * components can differ in sizing/layout only, never in behavior.
 */
export function useProductGridItemState({ product }: Props) {
  const { gallery, title, stockStatus, slug, categories } = product
  const flags = useFeatureFlags()
  const { toggle, isComparing } = useCompare()
  const { toggle: toggleWishlist, isSaved } = useWishlist()
  const { showWishlistPopover } = useWishlistPopover()
  const { open: openQuickView } = useQuickView()
  const { currency } = useCurrency()
  const tilt = useTilt3D<HTMLDivElement>()

  const priceField = `priceIn${currency.code}` as keyof Product
  const compareAtPriceField = `compareAtPriceIn${currency.code}` as keyof Product
  const salePriceField = `salePriceIn${currency.code}` as keyof Product

  const stockBadge =
    stockStatus && stockStatus in STOCK_BADGE ? STOCK_BADGE[stockStatus as keyof typeof STOCK_BADGE] : undefined
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

  const galleryImage = gallery?.[0]?.image
  const image: Exclude<typeof galleryImage, string | null | undefined> | false =
    galleryImage && typeof galleryImage !== 'string' ? galleryImage : false

  const productId = product.id ? String(product.id) : undefined
  const comparing = productId ? isComparing(productId) : false
  const saved = productId ? isSaved(productId) : false

  const firstVariant = variants && variants.length > 0 ? variants[0] : undefined
  const variantId = firstVariant && typeof firstVariant === 'object' ? firstVariant.id : undefined

  const firstCategory = Array.isArray(categories) && categories[0] ? categories[0] : undefined

  const variantInventory = firstVariant && typeof firstVariant === 'object' ? firstVariant.inventory : undefined

  const handleQuickView = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    openQuickView(product as Product)
  }

  const handleToggleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!productId) return
    if (!saved) showWishlistPopover(product as Product)
    toggleWishlist(productId)
  }

  const handleToggleCompare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (productId) toggle(productId)
  }

  return {
    comparing,
    discountPercent,
    displayPrice,
    firstCategory,
    flags,
    handleToggleCompare,
    handleToggleWishlist,
    handleQuickView,
    hasDiscount,
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
    hasVariants,
  }
}
