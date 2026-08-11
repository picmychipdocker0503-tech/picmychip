import { getAverageRatings } from '@/lib/getAverageRatings'
import { getPersonalizedRecommendations } from '@/lib/getPersonalizedRecommendations'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit')) || 8
  const idsParam = request.nextUrl.searchParams.get('ids') ?? ''
  const viewedProductIds = idsParam.split(',').filter(Boolean)

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
