import { checkRole } from '@/access/utilities'
import { getAccessibleOrder } from '@/lib/getAccessibleOrder'
import { getInvoicePdfBytes } from '@/lib/zoho/invoices'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Streams back the actual PDF Zoho Books generated for this order's invoice
 * (the real, numbered tax invoice — not the app's own computed HTML view at
 * /orders/[id]/invoice, which stays as a fallback for orders that haven't
 * synced to Zoho yet). Same guest/owner access rule as that page.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') || undefined
  const accessToken = searchParams.get('accessToken') || undefined

  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  const order = checkRole(['admin'], user)
    ? await payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true }).catch(() => null)
    : await getAccessibleOrder({ payload, id, user, email, accessToken })

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  if (!order.zohoInvoiceId) {
    return NextResponse.json({ error: 'Invoice has not been generated yet — please check back shortly.' }, { status: 404 })
  }

  try {
    const pdf = await getInvoicePdfBytes(order.zohoInvoiceId)

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${order.zohoInvoiceNumber || `invoice-${order.id}`}.pdf"`,
      },
    })
  } catch (err) {
    payload.logger.error({ msg: 'Failed to download Zoho invoice PDF', err, orderId: order.id })
    return NextResponse.json({ error: 'Could not download the invoice — please try again shortly.' }, { status: 502 })
  }
}
