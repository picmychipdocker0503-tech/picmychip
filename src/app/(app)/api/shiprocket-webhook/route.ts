import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { isValidSecret } from '@/lib/verifySecret'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

type Body = {
  awb?: string
  current_status?: string
  order_id?: string
}

/**
 * Receiver for Shiprocket's shipment-status webhook (configure the URL +
 * this secret as the "API Token" in Shiprocket's dashboard under
 * Settings > API > Configure Webhook). Keeps `shipmentStatus`/`trackingNumber`
 * in sync without polling — matches the /api/inventory-webhook pattern.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { allowed } = checkRateLimit(`shiprocket-webhook:${ip}`, 60, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const secret = request.headers.get('x-api-key')

  if (!isValidSecret(secret, process.env.SHIPROCKET_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = (await request.json()) as Body
  const { order_id: orderId, current_status: currentStatus, awb } = body

  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const { docs } = await payload.find({
      collection: 'orders',
      where: { shiprocketOrderId: { equals: orderId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const order = docs[0]
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        ...(currentStatus ? { shipmentStatus: currentStatus } : {}),
        ...(awb ? { trackingNumber: awb } : {}),
        ...(currentStatus?.toLowerCase() === 'delivered' ? { status: 'completed' } : {}),
      },
      overrideAccess: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    payload.logger.error({ msg: 'Shiprocket webhook processing failed', err })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
