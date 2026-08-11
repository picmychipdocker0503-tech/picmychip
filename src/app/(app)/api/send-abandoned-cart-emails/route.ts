import { abandonedCartEmailHtml, sendMail } from '@/lib/email'
import { getServerSideURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

const MIN_INACTIVITY_HOURS = 2
const MAX_AGE_DAYS = 7

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
  const now = Date.now()
  const inactiveSince = new Date(now - MIN_INACTIVITY_HOURS * 60 * 60 * 1000)
  const oldestEligible = new Date(now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000)

  try {
    const { docs: carts } = await payload.find({
      collection: 'carts',
      depth: 1,
      limit: 200,
      overrideAccess: true,
      where: {
        and: [
          { purchasedAt: { exists: false } },
          { customer: { exists: true } },
          { abandonedRecoveryEmailSentAt: { exists: false } },
          { updatedAt: { less_than_equal: inactiveSince.toISOString() } },
          { updatedAt: { greater_than_equal: oldestEligible.toISOString() } },
        ],
      },
    })

    const siteUrl = getServerSideURL()
    let sent = 0

    for (const cart of carts) {
      const itemCount = cart.items?.length ?? 0
      const email = typeof cart.customer === 'object' ? cart.customer?.email : undefined
      if (itemCount === 0 || !email) continue

      await sendMail(payload, {
        to: email,
        subject: 'You left something in your cart',
        html: abandonedCartEmailHtml({ itemCount, siteUrl }),
      })

      await payload.update({
        collection: 'carts',
        id: cart.id,
        data: { abandonedRecoveryEmailSentAt: new Date().toISOString() },
        overrideAccess: true,
      })

      sent += 1
    }

    return NextResponse.json({ sent, checked: carts.length })
  } catch (err) {
    payload.logger.error({ msg: 'Abandoned cart email run failed', err })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
