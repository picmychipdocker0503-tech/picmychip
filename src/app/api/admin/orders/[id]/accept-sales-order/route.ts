import { checkRole } from '@/access/utilities'
import { acceptZohoSalesOrder } from '@/lib/orderIntegrations/syncZohoSalesOrder'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Admin-only "Accept" action — converts the order's Zoho sales order into an
 * invoice, once stock/availability has been confirmed. Idempotent: if the
 * sales order was already converted (e.g. directly in Zoho Books), this just
 * re-pulls that invoice instead of converting again.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!checkRole(['admin'], user)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  try {
    await acceptZohoSalesOrder(payload, id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not accept the sales order.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const order = await payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true })

  return NextResponse.json({
    invoiceSyncStatus: order.invoiceSyncStatus,
    zohoInvoiceNumber: order.zohoInvoiceNumber,
    zohoInvoiceUrl: order.zohoInvoiceUrl,
    error: order.integrationError?.invoice,
  })
}
