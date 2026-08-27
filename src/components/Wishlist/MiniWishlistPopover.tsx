'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { useCartDrawer } from '@/providers/CartDrawer'
import { useWishlistPopover } from '@/providers/WishlistPopover'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { HeartIcon, XIcon, ZapIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

/**
 * Compact "saved to wishlist" popover anchored to the header's Favorites
 * icon — mirrors MiniCartPopover, but nudges toward buying now rather than
 * just confirming the save: thumbnail + price, then Add to Cart / Buy Now.
 */
export const MiniWishlistPopover: React.FC = () => {
  const { activeProduct, hideWishlistPopover } = useWishlistPopover()
  const { addItem } = useCart()
  const { showMiniCart } = useCartDrawer()
  const { currency } = useCurrency()
  const router = useRouter()
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)

  useEffect(() => {
    hideWishlistPopover()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (!activeProduct) return

    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        hideWishlistPopover()
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideWishlistPopover()
    }

    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [activeProduct, hideWishlistPopover])

  if (!activeProduct) return null

  const priceField = `priceIn${currency.code}` as keyof Product
  const price = activeProduct[priceField] as number | null | undefined
  const image =
    activeProduct.gallery?.[0]?.image && typeof activeProduct.gallery[0]?.image !== 'string'
      ? activeProduct.gallery[0]?.image
      : undefined
  const outOfStock = activeProduct.stockStatus === 'out-of-stock'

  const handleAddToCart = () => {
    setIsAdding(true)
    addItem({ product: activeProduct.id })
      .then(() => {
        hideWishlistPopover()
        showMiniCart()
      })
      .catch(() => {
        toast.error('Could not add to cart — please try again.')
      })
      .finally(() => setIsAdding(false))
  }

  const handleBuyNow = () => {
    setIsBuyingNow(true)
    addItem({ product: activeProduct.id })
      .then(() => {
        hideWishlistPopover()
        router.push('/checkout')
      })
      .catch(() => {
        setIsBuyingNow(false)
        toast.error('Could not start checkout — please try again.')
      })
  }

  return (
    <div
      className="border-border bg-card animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 absolute top-full right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border shadow-xl duration-200"
      ref={containerRef}
    >
      <div className="border-border flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
          <HeartIcon className="size-3.5 fill-current" />
        </span>
        <span className="text-sm font-semibold">Saved to wishlist</span>
        <button
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground ml-auto"
          onClick={hideWishlistPopover}
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          className="border-border bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg border"
          href={`/products/${activeProduct.slug}`}
          onClick={hideWishlistPopover}
        >
          <Media fill imgClassName="object-cover" resource={image} size="56px" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            className="hover:text-primary block truncate text-sm font-medium transition-colors"
            href={`/products/${activeProduct.slug}`}
            onClick={hideWishlistPopover}
          >
            {activeProduct.title}
          </Link>
          {typeof price === 'number' && (
            <Price amount={price} as="span" className="text-foreground text-sm font-semibold" />
          )}
        </div>
      </div>

      <p className="text-muted-foreground px-4 pb-3 text-xs">
        {outOfStock ? "This item is out of stock right now." : 'Ready when you are — add it to your cart or buy it now.'}
      </p>

      <div className="border-border flex items-center gap-2 border-t px-4 py-3">
        <button
          className="border-border text-foreground hover:bg-muted flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          disabled={outOfStock || isAdding}
          onClick={handleAddToCart}
          type="button"
        >
          {isAdding ? 'Adding…' : 'Add to Cart'}
        </button>
        <button
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          disabled={outOfStock || isBuyingNow}
          onClick={handleBuyNow}
          type="button"
        >
          <ZapIcon className="size-3.5" />
          {isBuyingNow ? 'Redirecting…' : 'Buy Now'}
        </button>
      </div>
    </div>
  )
}
