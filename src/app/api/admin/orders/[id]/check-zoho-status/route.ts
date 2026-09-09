import { checkRole } from '@/access/utilities'
import { reconcileOrderWithZohoSalesOrder } from '@/lib/orderIntegrations/syncZohoSalesOrder'
import { getZohoSalesOrder } from '@/lib/zoho/salesOrders'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Admin-only live check against Zoho Books — called from OrderIntegrationPanel
 * when the order's admin page loads. There's no inbound webhook from Zoho
 * Books, so this is how a sales order voided or edited directly in Zoho
 * Books (not through this app's own "Accept" action) gets reflected back:
 * see reconcileOrderWithZohoSalesOrder for what actually happens.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!checkRole(['admin'], user)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const order = await payload
    .findByID({ collection: 'orders', id, depth: 0, overrideAccess: true })
    .catch(() => null)

  if (!order?.zohoSalesOrderId) {
    return NextResponse.json({ changed: false, voided: false })
  }

  try {
    const current = await getZohoSalesOrder(order.zohoSalesOrderId)
    const result = await reconcileOrderWithZohoSalesOrder(payload, id, current)
    return NextResponse.json({ ...result, zohoSalesOrderStatus: current.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not check Zoho sales order status.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
