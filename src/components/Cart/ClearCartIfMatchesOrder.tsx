'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect, useRef } from 'react'

type Props = {
  orderCartId?: number | string | null
}

/**
 * The cart provider tracks the "current cart" by an ID persisted in
 * localStorage, which survives the full page navigation to PayU and back —
 * unlike the COD flow (CheckoutPage's placeDirectOrder), which stays in the
 * SPA and calls clearCart() itself right after success, nothing ever told
 * the client the PayU-paid cart was done. The server marks it `purchasedAt`,
 * but the browser kept pointing at the same (now-historical) cart, so it
 * looked like the cart "wasn't removing" after checkout. Clearing it here
 * only when the locally-tracked cart actually IS this order's cart makes
 * this safe to render on every order page visit, not just the one right
 * after payment — revisiting an old order later is a no-op.
 */
export function ClearCartIfMatchesOrder({ orderCartId }: Props) {
  const { cart, clearCart } = useCart()
  const cleared = useRef(false)

  useEffect(() => {
    if (cleared.current || !orderCartId || !cart?.id) return
    if (String(cart.id) !== String(orderCartId)) return
    if (!cart.items || cart.items.length === 0) return

    cleared.current = true
    clearCart()
  }, [cart, orderCartId, clearCart])

  return null
}
