'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect, useState } from 'react'

import { currenciesConfig } from '@/lib/currencies'
import { notifyOnAddToCart } from '@/lib/tawk'
import { useAuth } from '@/providers/Auth'

// cart.subtotal (like every other priceInINR/amount field the ecommerce
// plugin manages) is stored in the currency's smallest unit — paise for
// INR, per currenciesConfig's `decimals: 2` — not rupees. Divide before
// handing it anywhere it'll be displayed as-is (Tawk attributes, Slack).
const minorUnitDivisor = (() => {
  const currency = currenciesConfig.supportedCurrencies.find(
    (candidate) => candidate.code === currenciesConfig.defaultCurrency,
  )
  return currency ? 10 ** currency.decimals : 1
})()

/**
 * Shared by every add-to-cart entry point (grid/card button, product page's
 * sticky bar) so the guest-only Tawk tag + Slack alert can't drift between
 * them. Call the returned `notifyGuestAddedToCart()` right after the
 * add/update promise resolves — addItem()'s promise resolves before the
 * setCart() it triggers is visible on this render, so this can't read fresh
 * cart data synchronously there. Instead it flags a pending notification and
 * a useEffect keyed on the next `cart` value (once fresh) builds and sends
 * it.
 */
export function useGuestCartAddNotification() {
  const { cart } = useCart()
  const { user } = useAuth()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!pending || user || !cart?.items?.length) return

    const items = cart.items
      .map((item) => (typeof item.product === 'object' ? item.product?.title : undefined))
      .filter((title): title is string => Boolean(title))
    const itemCount = cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
    const totalValue = typeof cart.subtotal === 'number' ? cart.subtotal / minorUnitDivisor : 0

    const cartSummary = { currency: currenciesConfig.defaultCurrency, itemCount, items, totalValue }

    notifyOnAddToCart(cartSummary)

    fetch('/api/cart/notify', {
      body: JSON.stringify({ ...cartSummary, visitorPage: window.location.pathname }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }).catch((error) => {
      console.error('[cart/notify]', error)
    })

    setPending(false)
  }, [cart, pending, user])

  return {
    /** No-ops for a logged-in user — safe to call unconditionally after any add/update. */
    notifyGuestAddedToCart: () => {
      if (!user) setPending(true)
    },
  }
}
