'use client'

import { useEffect } from 'react'

import { useCartDrawer } from '@/providers/CartDrawer'

const STYLE_ELEMENT_ID = 'tawk-cart-offset'
// Matches SheetContent's own w-3/4 sm:max-w-sm (src/components/ui/sheet.tsx)
// so the offset always clears the drawer's actual current width — a fixed
// pixel value would either undershoot on desktop or push the icon off the
// left edge entirely on a narrow phone.
const DRAWER_WIDTH_RATIO = 0.75
const DRAWER_MAX_WIDTH_PX = 384
const GAP_PX = 16

function getOffsetPx(): number {
  const drawerWidth = Math.min(window.innerWidth * DRAWER_WIDTH_RATIO, DRAWER_MAX_WIDTH_PX)
  return Math.round(drawerWidth + GAP_PX)
}

/**
 * The cart drawer (CartModal's Sheet) and the mini-cart confirmation both
 * anchor bottom-right — the same corner Tawk's bubble/chat window defaults
 * to. Confirmed live that Tawk_API.customStyle doesn't move it once the
 * widget has already rendered, so this overrides its injected iframe's
 * position directly via CSS instead, which takes effect regardless of
 * Tawk's own internal render timing. Shifts Tawk left, clear of the drawer,
 * while either is open; removes the override once both close.
 */
export const TawkCartOffsetSync: React.FC = () => {
  const { isOpen, isMiniCartOpen } = useCartDrawer()

  useEffect(() => {
    const shouldOffset = isOpen || isMiniCartOpen
    const existing = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null

    if (!shouldOffset) {
      existing?.remove()
      return
    }

    const styleEl = existing ?? document.createElement('style')
    styleEl.id = STYLE_ELEMENT_ID
    styleEl.textContent = `iframe[src*="tawk.to"] { right: ${getOffsetPx()}px !important; }`
    if (!existing) document.head.appendChild(styleEl)

    return () => {
      styleEl.remove()
    }
  }, [isOpen, isMiniCartOpen])

  return null
}
