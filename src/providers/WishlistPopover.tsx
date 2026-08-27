'use client'

import type { Product } from '@/payload-types'

import React, { createContext, useCallback, useContext, useState } from 'react'

type WishlistPopoverContextValue = {
  activeProduct: Product | null
  showWishlistPopover: (product: Product) => void // eslint-disable-line no-unused-vars
  hideWishlistPopover: () => void
}

const WishlistPopoverContext = createContext<WishlistPopoverContextValue | undefined>(undefined)

/**
 * Shared state for the "Saved to wishlist" popover, anchored to the header's
 * Favorites icon — mirrors CartDrawer's isMiniCartOpen pattern. Callers only
 * invoke showWishlistPopover when a heart click is actually adding the item
 * (not removing it), so this never pops up on unwishlist.
 */
export const WishlistPopoverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)

  const showWishlistPopover = useCallback((product: Product) => setActiveProduct(product), [])
  const hideWishlistPopover = useCallback(() => setActiveProduct(null), [])

  return (
    <WishlistPopoverContext.Provider value={{ activeProduct, showWishlistPopover, hideWishlistPopover }}>
      {children}
    </WishlistPopoverContext.Provider>
  )
}

export const useWishlistPopover = (): WishlistPopoverContextValue => {
  const ctx = useContext(WishlistPopoverContext)
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') {
      return { activeProduct: null, showWishlistPopover: () => {}, hideWishlistPopover: () => {} }
    }
    throw new Error('useWishlistPopover must be used within a WishlistPopoverProvider')
  }
  return ctx
}
