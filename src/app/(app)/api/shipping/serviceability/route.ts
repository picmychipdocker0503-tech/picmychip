import { checkServiceability, shiprocketIsConfigured } from '@/lib/shiprocket'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

type Body = {
  cartId: number | string
  pincode: string
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

  const body = (await request.json()) as Body
  const { cartId, pincode } = body

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
