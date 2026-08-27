import type { Payload } from 'payload'

import type { Product } from '@/payload-types'

type Options = {
  payload: Payload
  productId: number
  limit: number
}

/**
 * "Customers who bought this also bought" — order co-occurrence. Finds every
 * order containing `productId`, tallies which OTHER products showed up in
 * those same orders, and returns the most frequently co-purchased ones.
 * Falls back to same-category products when order history is too thin
 * (new/low-volume products) so the section never looks empty.
 */
export const getAlsoBoughtProducts = async ({ payload, productId, limit }: Options): Promise<Product[]> => {
  const { docs: orders } = await payload.find({
    collection: 'orders',
    limit: 500,
    overrideAccess: true,
    depth: 0,
    where: { 'items.product': { equals: productId } },
  })

  const countByProductId = new Map<number, number>()

  for (const order of orders) {
    for (const item of order.items ?? []) {
      const otherId = typeof item.product === 'object' ? item.product?.id : item.product
      if (!otherId || otherId === productId) continue
      countByProductId.set(otherId, (countByProductId.get(otherId) ?? 0) + 1)
    }
  }

  const rankedIds = [...countByProductId.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  const alsoBought =
    rankedIds.length > 0
      ? (
          await payload.find({
            collection: 'products',
            depth: 1,
            limit: rankedIds.length,
            overrideAccess: true,
            where: {
              and: [
                { id: { in: rankedIds } },
                { stockStatus: { not_equals: 'out-of-stock' } },
                { _status: { equals: 'published' } },
              ],
            },
          })
        ).docs.sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id))
      : []

  const stillNeeded = limit - alsoBought.length
  if (stillNeeded <= 0) return alsoBought

  const product = await payload.findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true })
  const categoryIds = (product?.categories ?? []).map((category) =>
    typeof category === 'object' ? category.id : category,
  )

  if (categoryIds.length === 0) return alsoBought

  const excludeIds = [productId, ...alsoBought.map((p) => p.id)]

  const { docs: sameCategory } = await payload.find({
    collection: 'products',
    depth: 1,
    limit: stillNeeded,
    overrideAccess: true,
    where: {
      and: [
        { categories: { in: categoryIds } },
        { id: { not_in: excludeIds } },
        { stockStatus: { not_equals: 'out-of-stock' } },
        { _status: { equals: 'published' } },
      ],
    },
  })

  return [...alsoBought, ...sameCategory]
}
