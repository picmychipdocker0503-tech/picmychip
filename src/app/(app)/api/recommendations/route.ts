import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { getAverageRatings } from '@/lib/getAverageRatings'
import { getPersonalizedRecommendations } from '@/lib/getPersonalizedRecommendations'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Fires automatically on every homepage load, so the cap stays generous —
// this is a safety net against scripted abuse, not a throttle on real traffic.
export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { allowed } = checkRateLimit(`recommendations:${ip}`, 120, 60_000)
  if (!allowed) {
    return NextResponse.json({ products: [] }, { status: 429 })
  }

  // Unbounded, a `?limit=999999` request would force fetching/rating an
  // unbounded number of products — clamp to the same ceiling the UI ever
  // actually requests (8).
  const requestedLimit = Number(request.nextUrl.searchParams.get('limit')) || 8
  const limit = Math.min(Math.max(requestedLimit, 1), 24)
  const idsParam = request.nextUrl.searchParams.get('ids') ?? ''
  const viewedProductIds = idsParam.split(',').filter(Boolean).slice(0, 50)

  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  const products = await getPersonalizedRecommendations({
    payload,
    limit,
    customerId: user?.id,
    viewedProductIds,
  })

  const ratings = await getAverageRatings(payload, products.map((product) => product.id))
  const ratedProducts = products.map((product) => ({
    ...product,
    averageRating: ratings.get(product.id)?.average,
    reviewCount: ratings.get(product.id)?.count,
  }))

  return NextResponse.json({ products: ratedProducts })
}
