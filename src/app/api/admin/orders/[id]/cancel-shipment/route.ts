import { checkRole } from '@/access/utilities'
import { cancelShiprocketShipmentForOrder } from '@/lib/orderIntegrations/syncShiprocketShipment'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

type RouteContext = { params: Promise<{ id: string }> }

/** Admin-only — cancels the Shiprocket order, if one exists and hasn't shipped yet. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!checkRole(['admin'], user)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  try {
    await cancelShiprocketShipmentForOrder(payload, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not cancel shipment.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
