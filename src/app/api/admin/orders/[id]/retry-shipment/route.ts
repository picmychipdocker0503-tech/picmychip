import { checkRole } from '@/access/utilities'
import { syncShiprocketShipmentForOrder } from '@/lib/orderIntegrations/syncShiprocketShipment'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Admin-only manual retry for a failed (or not-yet-attempted) Shiprocket
 * shipment sync — reuses the exact same idempotent logic the
 * createShiprocketShipment afterChange hook calls automatically on order
 * creation.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!checkRole(['admin'], user)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  await syncShiprocketShipmentForOrder(payload, id)

  const order = await payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true })

  return NextResponse.json({
    shipmentSyncStatus: order.shipmentSyncStatus,
    trackingNumber: order.trackingNumber,
    courierName: order.courierName,
    shipmentStatus: order.shipmentStatus,
    error: order.integrationError?.shipment,
  })
}
