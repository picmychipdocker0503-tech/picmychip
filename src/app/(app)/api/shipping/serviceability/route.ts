import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { checkServiceability, shiprocketIsConfigured } from '@/lib/shiprocket'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

type Body = {
  cartId: number | string
  pincode: string
  /** Guest-cart proof of ownership — mirrors the plugin's own hasCartSecretAccess check. */
  secret?: string
}

/**
 * Checkout-time rate/ETA check — given a cart and a delivery pincode, returns
 * which couriers Shiprocket can serve it with and roughly what they'd charge.
 * Informational only: this does not create anything in Shiprocket and does
 * not change the order total (product prices already include shipping via
 * the free-shipping-threshold model; see FREE_SHIPPING_THRESHOLD).
 */
export async function POST(request: NextRequest) {
  if (!shiprocketIsConfigured) {
    return NextResponse.json({ configured: false, options: [], serviceable: false })
  }

  // This calls a paid third-party API per request — cap abuse before it
  // reaches Shiprocket.
  const ip = getClientIp(request.headers)
  const { allowed, resetAt } = checkRateLimit(`shipping-check:${ip}`, 20, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } },
    )
  }

  const body = (await request.json()) as Body
  const { cartId, pincode, secret } = body

  if (!cartId || !pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: 'Provide cartId and a valid 6-digit pincode.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const cart = await payload.findByID({
      collection: 'carts',
      id: cartId,
      depth: 1,
      overrideAccess: true,
    })

    if (!cart?.items?.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    // `overrideAccess: true` above bypasses the collection's own access
    // control, so ownership has to be re-checked by hand — same pattern (and
    // same reason) as /api/cart/discount: without this, cart weight/value
    // leaks to anyone who guesses a cartId.
    const { user } = await payload.auth({ headers: await getHeaders() })
    const customerId = typeof cart.customer === 'object' ? cart.customer?.id : cart.customer
    const ownsAsCustomer = Boolean(user) && customerId === user?.id
    const ownsAsGuest = Boolean(cart.secret) && Boolean(secret) && cart.secret === secret

    if (!ownsAsCustomer && !ownsAsGuest) {
      return NextResponse.json({ error: 'Not authorized to check this cart.' }, { status: 403 })
    }

    const totalWeightGrams = cart.items.reduce((sum, item) => {
      const weight = typeof item.product === 'object' ? (item.product?.weightInGrams ?? 50) : 50
      return sum + weight * (item.quantity ?? 1)
    }, 0)

    const result = await checkServiceability({
      deliveryPostcode: pincode,
      weightKg: Math.max(totalWeightGrams / 1000, 0.05),
      codAmount: cart.subtotal ?? 0,
    })

    return NextResponse.json({ configured: true, ...result })
  } catch (err) {
    payload.logger.error({ msg: 'Shiprocket serviceability check failed', err })
    return NextResponse.json({ error: 'Could not check delivery availability.' }, { status: 502 })
  }
}
