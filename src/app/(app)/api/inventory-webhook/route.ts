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
  const secret = request.headers.get('x-webhook-secret')

  if (!process.env.INVENTORY_WEBHOOK_SECRET || secret !== process.env.INVENTORY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = (await request.json()) as Body
  const { sku, productId, inventory } = body

  if (typeof inventory !== 'number' || (!sku && !productId)) {
    return NextResponse.json({ error: 'Provide inventory and either sku or productId.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    let id = productId

    if (!id && sku) {
      const { docs } = await payload.find({
        collection: 'products',
        where: { slug: { equals: sku } },
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
