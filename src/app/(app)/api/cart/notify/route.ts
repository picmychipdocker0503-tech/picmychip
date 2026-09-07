import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

type Body = {
  items: string[]
  totalValue: number
  currency: string
  visitorPage?: string
}

const BUSINESS_HOURS_TIMEZONE = 'Asia/Kolkata'
// Falls back to these if Site Settings > Tawk Chat Business Hours is blank
// or fails to load.
const DEFAULT_BUSINESS_HOURS_START_MINUTES = 9 * 60 // 9:00 AM
const DEFAULT_BUSINESS_HOURS_END_MINUTES = 18 * 60 + 30 // 6:30 PM
const BUSINESS_DAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

function parseTimeToMinutes(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim())
  if (!match) return fallback
  return Number(match[1]) * 60 + Number(match[2])
}

// Duplicated from src/lib/tawk.ts's isWithinBusinessHours — that one runs
// client-side (in the browser's JS bundle) and this route runs server-side,
// so they can't share the same module without pulling browser-only Tawk
// globals into a server route. Keep both in sync if the hours ever change.
async function isBusinessHoursServer(): Promise<boolean> {
  try {
    const payload = await getPayload({ config: configPromise })
    const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const startMinutes = parseTimeToMinutes(
      siteSettings?.tawkBusinessHours?.startTime,
      DEFAULT_BUSINESS_HOURS_START_MINUTES,
    )
    const endMinutes = parseTimeToMinutes(
      siteSettings?.tawkBusinessHours?.endTime,
      DEFAULT_BUSINESS_HOURS_END_MINUTES,
    )

    const now = new Date()
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: BUSINESS_HOURS_TIMEZONE, weekday: 'short' }).format(
      now,
    )
    if (!BUSINESS_DAYS.has(weekday)) return false

    const [hour, minute] = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_HOURS_TIMEZONE,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .reduce<number[]>((parts, part) => {
        if (part.type === 'hour' || part.type === 'minute') parts.push(Number(part.value))
        return parts
      }, [])
    if (Number.isNaN(hour) || Number.isNaN(minute)) return false

    const totalMinutes = hour * 60 + minute
    return totalMinutes >= startMinutes && totalMinutes < endMinutes
  } catch {
    return false
  }
}

/**
 * Guaranteed internal notification when a guest adds an item to their cart —
 * independent of whether they ever engage with the Tawk chat widget (see
 * src/lib/tawk.ts's notifyOnAddToCart, called alongside this from the same
 * add-to-cart handler). Posts straight to a Slack incoming webhook.
 */
export async function POST(request: NextRequest) {
  if (!(await isBusinessHoursServer())) {
    return NextResponse.json({ skipped: true, reason: 'outside-business-hours' })
  }

  const webhookUrl = process.env.SLACK_CART_ALERTS_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'SLACK_CART_ALERTS_WEBHOOK_URL is not configured.' }, { status: 500 })
  }

  try {
    const body = (await request.json()) as Body
    const { items, totalValue, currency, visitorPage } = body

    const lines = [
      '🛒 *Guest added to cart*',
      `*Items:* ${items.join(', ') || 'unknown'}`,
      `*Total:* ${currency} ${totalValue.toFixed(2)}`,
    ]
    if (visitorPage) lines.push(`*Page:* ${visitorPage}`)

    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
    })

    if (!slackRes.ok) {
      throw new Error(`Slack webhook responded ${slackRes.status}: ${await slackRes.text()}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[api/cart/notify]', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
