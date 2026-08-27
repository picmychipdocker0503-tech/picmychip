'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

type CartDrawerContextValue = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void // eslint-disable-line no-unused-vars
  openCart: () => void
  isMiniCartOpen: boolean
  showMiniCart: () => void
  hideMiniCart: () => void
}

const CartDrawerContext = createContext<CartDrawerContextValue | undefined>(undefined)

/**
 * Shared open/closed state for both cart surfaces:
 *  - the full-height Sheet (CartModal), opened by the header's cart icon
 *  - a small popover anchored to that same icon (MiniCartPopover), opened by
 *    a quick "Add to cart" from a listing card — an Amazon-style "added to
 *    cart" confirmation rather than the full drawer taking over the screen.
 */
export const CartDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false)

  const openCart = useCallback(() => setIsOpen(true), [])
  const showMiniCart = useCallback(() => setIsMiniCartOpen(true), [])
  const hideMiniCart = useCallback(() => setIsMiniCartOpen(false), [])

  return (
    <CartDrawerContext.Provider
      value={{ isOpen, setIsOpen, openCart, isMiniCartOpen, showMiniCart, hideMiniCart }}
    >
      {children}
    </CartDrawerContext.Provider>
  )
}

export const useCartDrawer = (): CartDrawerContextValue => {
  const ctx = useContext(CartDrawerContext)
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        isOpen: false,
        setIsOpen: () => {},
        openCart: () => {},
        isMiniCartOpen: false,
        showMiniCart: () => {},
        hideMiniCart: () => {},
      }
    }
    throw new Error('useCartDrawer must be used within a CartDrawerProvider')
  }
  return ctx
}
