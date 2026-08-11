import type { Payload } from 'payload'

export type RatingInfo = { average: number; count: number }

/**
 * Batch-fetches approved review ratings for a set of products in one query
 * (rather than one query per card) — used to show star ratings on product
 * cards across the homepage/PDP without an N+1 query pattern.
 */
export const getAverageRatings = async (
  payload: Payload,
  productIds: number[],
): Promise<Map<number, RatingInfo>> => {
  const ratings = new Map<number, RatingInfo>()
  if (productIds.length === 0) return ratings

  const { docs } = await payload.find({
    collection: 'reviews',
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    select: { product: true, rating: true },
    where: { and: [{ product: { in: productIds } }, { status: { equals: 'approved' } }] },
  })

  const sums = new Map<number, { total: number; count: number }>()

  for (const review of docs) {
    const productId = typeof review.product === 'object' ? review.product?.id : review.product
    if (!productId) continue
    const entry = sums.get(productId) ?? { total: 0, count: 0 }
    entry.total += review.rating
    entry.count += 1
    sums.set(productId, entry)
  }

  for (const [productId, { total, count }] of sums) {
    ratings.set(productId, { average: total / count, count })
  }

  return ratings
}
