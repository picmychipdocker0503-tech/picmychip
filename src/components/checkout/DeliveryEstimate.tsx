'use client'

import { useEffect, useState } from 'react'

import { getClientSideURL } from '@/utilities/getURL'

type ServiceabilityOption = {
  courierName: string
  estimatedDeliveryDays: string
  freightCharge: number
}

type Props = {
  cartId: number | string | undefined
  pincode: string | undefined
}

/**
 * Checks Shiprocket serviceability for the entered address's pincode and
 * shows the fastest ETA — purely informational (order total is unaffected;
 * see FREE_SHIPPING_THRESHOLD for how shipping cost is actually handled).
 * Renders nothing if Shiprocket isn't configured or the pincode isn't
 * serviceable, so it's a no-op until SHIPROCKET_* env vars are set.
 */
export const DeliveryEstimate: React.FC<Props> = ({ cartId, pincode }) => {
  const [state, setState] = useState<
    { options: ServiceabilityOption[]; status: 'idle' | 'loading' | 'done' | 'error' }
  >({ status: 'idle', options: [] })

  useEffect(() => {
    if (!cartId || !pincode || !/^\d{6}$/.test(pincode)) {
      setState({ status: 'idle', options: [] })
      return
    }

    let cancelled = false
    setState({ status: 'loading', options: [] })

    // Guest carts prove ownership via this secret (see /api/cart/discount
    // for the same pattern) — logged-in users are authorized via their
    // session cookie server-side instead.
    const secret = window.localStorage.getItem('cart_secret') ?? undefined

    fetch(`${getClientSideURL()}/api/shipping/serviceability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ cartId, pincode, secret }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setState({ status: 'done', options: data.options || [] })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', options: [] })
      })

    return () => {
      cancelled = true
    }
  }, [cartId, pincode])

  if (state.status !== 'done' || state.options.length === 0) return null

  const fastest = [...state.options].sort(
    (a, b) => parseFloat(a.estimatedDeliveryDays) - parseFloat(b.estimatedDeliveryDays),
  )[0]

  return (
    <p className="text-muted-foreground text-sm">
      🚚 Delivers via {fastest.courierName} in ~{fastest.estimatedDeliveryDays} days to {pincode}
    </p>
  )
}
