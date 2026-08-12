import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { searchProducts } from '@/lib/searchProducts'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  // The UI already debounces at 200ms, so a real typing user stays well
  // under this — it's aimed at scripted scraping of the search index.
  const ip = getClientIp(request.headers)
  const { allowed } = checkRateLimit(`search-suggestions:${ip}`, 60, 60_000)
  if (!allowed) {
    return NextResponse.json({ suggestions: [], error: 'Too many requests.' }, { status: 429 })
  }

  const result = await searchProducts({ query, limit: 6 })

  const suggestions = result.docs.map((product) => {
    const image = product.gallery?.[0]?.image
    const category = product.categories?.find((c) => typeof c === 'object') as
      | { title?: string; slug?: string }
      | undefined

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      imageUrl: typeof image === 'object' && image ? image.url : undefined,
      priceInINR: product.priceInINR,
      stockStatus: product.stockStatus,
      categoryTitle: category?.title,
    }
  })

  return NextResponse.json({ suggestions, totalDocs: result.totalDocs })
}
