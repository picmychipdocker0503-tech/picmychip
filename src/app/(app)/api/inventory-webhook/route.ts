import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { isValidSecret } from '@/lib/verifySecret'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

type Body = {
  sku?: string
  productId?: number
  inventory: number
}

/**
 * Receiver for an external inventory/warehouse system to push real-time stock
 * updates. Authenticated via a shared secret header (`x-webhook-secret`) —
 * plug your ERP/WMS's webhook config to POST here. Updating inventory through
 * the normal Local API update means the existing stockStatus-derivation hook
 * and the back-in-stock notification hook both fire exactly as they would
 * from an admin edit.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  // Generous limit — this is a legitimate integration endpoint, not a public
  // one — but still bounds how fast a leaked/guessed secret can be abused.
  const { allowed } = checkRateLimit(`inventory-webhook:${ip}`, 60, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  if (!isValidSecret(request.headers.get('x-webhook-secret'), process.env.INVENTORY_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = (await request.json()) as Body
  const { sku, productId, inventory } = body

  if (typeof inventory !== 'number' || inventory < 0 || (!sku && !productId)) {
    return NextResponse.json({ error: 'Provide a non-negative inventory and either sku or productId.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    let id = productId

    if (!id && sku) {
      const { docs } = await payload.find({
        collection: 'products',
        where: { sku: { equals: sku } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      id = docs[0]?.id
    }

    if (!id) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    const updated = await payload.update({
      collection: 'products',
      id,
      data: { inventory },
      overrideAccess: true,
    })

    return NextResponse.json({ productId: updated.id, inventory: updated.inventory, stockStatus: updated.stockStatus })
  } catch (err) {
    payload.logger.error({ msg: 'Inventory webhook failed', err })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
