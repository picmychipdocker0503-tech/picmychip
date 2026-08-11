import type { Payload } from 'payload'

import type { Product } from '@/payload-types'

const LOOKBACK_DAYS = 30

type Options = {
  payload: Payload
  limit: number
  pinnedProducts?: (number | Product)[] | null
}

/**
 * Best-sellers over the last 30 days by units ordered, with graceful
 * degradation when order volume is too thin to be meaningful: falls back to
 * `featured` products, then most-recently-added. Pinned products always lead.
 */
export const getTrendingProducts = async ({ payload, limit, pinnedProducts }: Options): Promise<Product[]> => {
  const pinned = (pinnedProducts ?? [])
    .map((product) => (typeof product === 'object' ? product : null))
    .filter((product): product is Product => Boolean(product))

  const remainingSlots = limit - pinned.length
  if (remainingSlots <= 0) return pinned.slice(0, limit)

  const excludeIds = pinned.map((product) => product.id)
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { docs: recentOrders } = await payload.find({
    collection: 'orders',
    limit: 500,
    overrideAccess: true,
    where: {
      and: [{ createdAt: { greater_than: since } }, { status: { equals: 'completed' } }],
    },
  })

  const quantityByProductId = new Map<number, number>()

  for (const order of recentOrders) {
    for (const item of order.items ?? []) {
      const productId = typeof item.product === 'object' ? item.product?.id : item.product
      if (!productId || excludeIds.includes(productId)) continue
      quantityByProductId.set(productId, (quantityByProductId.get(productId) ?? 0) + (item.quantity ?? 0))
    }
  }

  const bestSellingIds = [...quantityByProductId.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, remainingSlots)
    .map(([id]) => id)

  const bestSelling =
    bestSellingIds.length > 0
      ? (
          await payload.find({
            collection: 'products',
            depth: 1,
            limit: bestSellingIds.length,
            overrideAccess: true,
            where: { id: { in: bestSellingIds } },
          })
        ).docs.sort((a, b) => bestSellingIds.indexOf(a.id) - bestSellingIds.indexOf(b.id))
      : []

  const stillNeeded = remainingSlots - bestSelling.length
  const fallback: Product[] = []

  if (stillNeeded > 0) {
    const excludeAll = [...excludeIds, ...bestSelling.map((product) => product.id)]

    const { docs: featured } = await payload.find({
      collection: 'products',
      depth: 1,
      limit: stillNeeded,
      overrideAccess: true,
      where: { and: [{ featured: { equals: true } }, { id: { not_in: excludeAll } }] },
    })
    fallback.push(...featured)

    const stillNeededAfterFeatured = stillNeeded - featured.length
    if (stillNeededAfterFeatured > 0) {
      const { docs: recent } = await payload.find({
        collection: 'products',
        depth: 1,
        limit: stillNeededAfterFeatured,
        overrideAccess: true,
        sort: '-createdAt',
        where: { id: { not_in: [...excludeAll, ...featured.map((product) => product.id)] } },
      })
      fallback.push(...recent)
    }
  }

  return [...pinned, ...bestSelling, ...fallback]
}
