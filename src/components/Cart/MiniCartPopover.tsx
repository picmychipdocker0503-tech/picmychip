'use client'

import type { CartItem } from '@/components/Cart'
import type { Product, Variant } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { resolveTieredUnitPrice } from '@/lib/priceTiers'
import { useCartDrawer } from '@/providers/CartDrawer'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckCircle2Icon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

import { EditItemQuantityButton } from './EditItemQuantityButton'

type GalleryItem = NonNullable<Product['gallery']>[number]
type VariantOptionItem = NonNullable<Variant['options']>[number]

/**
 * Compact "added to cart" confirmation anchored to the header's cart icon —
 * an Amazon-style popover (thumbnail + subtotal + "Go to Cart") rather than
 * the full-height Sheet taking over the screen. Renders alongside <Cart /> in
 * MainHeader, inside the same `relative` wrapper it anchors to.
 */
export const MiniCartPopover: React.FC = () => {
  const { cart } = useCart()
  const { isMiniCartOpen, hideMiniCart } = useCartDrawer()
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    hideMiniCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (!isMiniCartOpen) return

    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        hideMiniCart()
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideMiniCart()
    }

    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isMiniCartOpen, hideMiniCart])

  if (!isMiniCartOpen) return null

  return (
    <div
      className="border-border bg-card animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 absolute top-full right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border shadow-xl duration-200"
      ref={containerRef}
    >
      <div className="border-border flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-success/15 text-success flex size-6 shrink-0 items-center justify-center rounded-full">
          <CheckCircle2Icon className="size-4" />
        </span>
        <span className="text-sm font-semibold">Added to cart</span>
        <button
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground ml-auto"
          onClick={hideMiniCart}
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {!cart || !cart.items || cart.items.length === 0 ? (
        <p className="text-muted-foreground p-4 text-sm">Your cart is empty.</p>
      ) : (
        <ul className="max-h-72 overflow-y-auto px-4 py-2">
          {cart.items.map((item, i) => (
            <MiniCartItem item={item as CartItem} key={item.id ?? i} />
          ))}
        </ul>
      )}

      <div className="border-border border-t px-4 py-3">
        {typeof cart?.subtotal === 'number' && (
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <Price amount={cart.subtotal} as="span" className="text-foreground font-semibold" />
          </div>
        )}
        <Link
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center rounded-full py-2.5 text-sm font-semibold transition-colors"
          href="/cart"
          onClick={hideMiniCart}
        >
          Go to Cart
        </Link>
      </div>
    </div>
  )
}

const MiniCartItem: React.FC<{ item: CartItem }> = ({ item }) => {
  const product = item.product
  const variant = item.variant

  if (typeof product !== 'object' || !product) return null

  const metaImage =
    product.meta?.image && typeof product.meta?.image === 'object' ? product.meta.image : undefined
  const firstGalleryImage =
    typeof product.gallery?.[0]?.image === 'object' ? product.gallery?.[0]?.image : undefined

  let image = firstGalleryImage || metaImage
  let basePrice = product.priceInINR
  let tiers = product.priceTiers

  const isVariant = Boolean(variant) && typeof variant === 'object'

  if (isVariant) {
    basePrice = variant?.priceInINR
    tiers = variant?.priceTiers

    const imageVariant = product.gallery?.find((galleryItem: GalleryItem) => {
      if (!galleryItem.variantOption) return false
      const variantOptionID =
        typeof galleryItem.variantOption === 'object' ? galleryItem.variantOption.id : galleryItem.variantOption

      return variant?.options?.some((option: VariantOptionItem) => {
        if (typeof option === 'object') return option.id === variantOptionID
        return option === variantOptionID
      })
    })

    if (imageVariant && typeof imageVariant.image === 'object') {
      image = imageVariant.image
    }
  }

  const price =
    typeof basePrice === 'number' ? resolveTieredUnitPrice(basePrice, tiers, item.quantity ?? 1) : undefined

  return (
    <li className="flex items-center gap-3 py-2">
      <div className="border-border bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg border">
        <Media fill imgClassName="object-cover" resource={image} size="56px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.title}</p>
        {typeof price === 'number' && (
          <Price amount={price} as="span" className="text-muted-foreground text-xs" />
        )}
      </div>
      <div className="border-border flex shrink-0 items-center rounded-full border">
        <EditItemQuantityButton item={item} type="minus" />
        <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
        <EditItemQuantityButton item={item} type="plus" />
      </div>
    </li>
  )
}
