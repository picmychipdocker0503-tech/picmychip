import { sendAbandonedCartEmails } from '@/lib/sendAbandonedCartEmails'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Triggered by an external cron (same pattern as /api/search/reindex) rather
 * than Payload's Jobs Queue, which isn't set up in this project — one fewer
 * subsystem to run. Only targets logged-in customers' carts: guest carts have
 * no captured email until checkout, so there's nothing to send to until then.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')

  if (!process.env.ABANDONED_CART_SECRET || secret !== process.env.ABANDONED_CART_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const result = await sendAbandonedCartEmails(payload)
    return NextResponse.json(result)
  } catch (err) {
    payload.logger.error({ msg: 'Abandoned cart email run failed', err })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
