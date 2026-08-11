import { searchProducts } from '@/lib/searchProducts'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const result = await searchProducts({ query, limit: 6 })

  const suggestions = result.docs.map((product) => {
    const image = product.gallery?.[0]?.image
    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      imageUrl: typeof image === 'object' && image ? image.url : undefined,
      priceInINR: product.priceInINR,
    }
  })

  return NextResponse.json({ suggestions })
}
