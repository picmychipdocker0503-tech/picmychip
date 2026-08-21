import configPromise from '@payload-config'
import { buildGoogleMerchantFeed } from '@/lib/googleMerchant/feed'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const secret = process.env.GOOGLE_MERCHANT_FEED_SECRET
  if (secret && request.nextUrl.searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const payload = await getPayload({ config: configPromise })
  const feed = await buildGoogleMerchantFeed(payload)

  return new NextResponse(feed, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
