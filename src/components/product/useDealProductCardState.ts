import type { Product } from '@/payload-types'

import { useTilt3D } from '@/lib/useTilt3D'
import { useCartDrawer } from '@/providers/CartDrawer'
import { useQuickView } from '@/providers/QuickView'
import { useWishlist } from '@/providers/Wishlist'
import { useWishlistPopover } from '@/providers/WishlistPopover'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import React, { useState } from 'react'

type Props = {
  product: Partial<Product>
  averageRating?: number
  reviewCount?: number
}

const STOCK_LABEL: Record<string, { label: string; className: string }> = {
  'in-stock': { label: 'In Stock', className: 'text-success' },
  'out-of-stock': { label: 'Out of Stock', className: 'text-error' },
  'low-stock': { label: 'Low Stock', className: 'text-warning' },
  backorder: { label: 'Backorder', className: 'text-warning' },
}

/**
 * All the derived state and handlers behind DealProductCard — shared by the
 * desktop card and MobileDealProductCard so the two presentational
 * components can differ in sizing/layout only, never in behavior (there's
 * exactly one place price/discount/stock logic and the add-to-cart/wishlist
 * handlers live).
 */
export function useDealProductCardState({ product }: Props) {
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

  const galleryImage = product.gallery?.[0]?.image
  const image: Exclude<typeof galleryImage, string | null | undefined> | false =
    galleryImage && typeof galleryImage !== 'string' ? galleryImage : false

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

  const handleQuickView = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (product.id) open(product as Product)
  }

  const handleToggleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (productId) {
      if (!saved) showWishlistPopover(product as Product)
      toggleWishlist(productId)
    }
  }

  return {
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
  }
}
