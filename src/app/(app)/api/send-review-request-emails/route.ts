import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { sendReviewRequestEmails } from '@/lib/sendReviewRequestEmails'
import { isValidSecret } from '@/lib/verifySecret'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Triggered by an external cron (same pattern as /api/send-abandoned-cart-emails)
 * rather than Payload's Jobs Queue, which isn't set up in this project.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { allowed } = checkRateLimit(`review-request-emails:${ip}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const secret = request.headers.get('x-webhook-secret')

  if (!isValidSecret(secret, process.env.REVIEW_REQUEST_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const result = await sendReviewRequestEmails(payload)
    return NextResponse.json(result)
  } catch (err) {
    payload.logger.error({ msg: 'Review request email run failed', err })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
