import { checkRole } from '@/access/utilities'
import { getAccessibleOrder } from '@/lib/getAccessibleOrder'
import { getCreditNotePdfBytes } from '@/lib/zoho/creditNotes'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

type RouteContext = { params: Promise<{ id: string }> }

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

  if (!order.zohoCreditNoteId) {
    return NextResponse.json({ error: 'Credit note has not been generated yet.' }, { status: 404 })
  }

  try {
    const pdf = await getCreditNotePdfBytes(order.zohoCreditNoteId)

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${order.zohoCreditNoteNumber || `credit-note-${order.id}`}.pdf"`,
      },
    })
  } catch (err) {
    payload.logger.error({ msg: 'Failed to download Zoho credit note PDF', err, orderId: order.id })
    return NextResponse.json({ error: 'Could not download the credit note — please try again shortly.' }, { status: 502 })
  }
}
