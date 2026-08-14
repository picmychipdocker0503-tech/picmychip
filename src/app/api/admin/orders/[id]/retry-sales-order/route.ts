import { checkRole } from '@/access/utilities'
import { syncZohoSalesOrderForOrder } from '@/lib/orderIntegrations/syncZohoSalesOrder'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Admin-only manual retry for a failed (or not-yet-attempted) Zoho sales
 * order sync — reuses the exact same idempotent logic the
 * createZohoSalesOrder afterChange hook calls automatically on order
 * creation. Also re-checks whether the sales order has already been
 * accepted/converted to an invoice directly in Zoho Books, and pulls that
 * in if so.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!checkRole(['admin'], user)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  await syncZohoSalesOrderForOrder(payload, id)

  const order = await payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true })

  return NextResponse.json({
    salesOrderSyncStatus: order.salesOrderSyncStatus,
    zohoSalesOrderNumber: order.zohoSalesOrderNumber,
    invoiceSyncStatus: order.invoiceSyncStatus,
    zohoInvoiceNumber: order.zohoInvoiceNumber,
    zohoInvoiceUrl: order.zohoInvoiceUrl,
    error: order.integrationError?.salesOrder || order.integrationError?.invoice,
  })
}
