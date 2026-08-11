import type { Payload } from 'payload'

import type { Product } from '@/payload-types'

type Options = {
  payload: Payload
  limit: number
  /** Logged-in customer id — takes priority (purchase history) over `viewedProductIds`. */
  customerId?: number
  /** Recently-viewed product ids (localStorage, guest browsing history) fallback. */
  viewedProductIds?: string[]
}

const productIdOf = (category: unknown): number | undefined =>
  typeof category === 'object' && category ? (category as { id: number }).id : (category as number | undefined)

/**
 * "Recommended for You" — purchase-history based for logged-in customers
 * (top categories from their past orders), browsing-history based for
 * guests (categories of recently-viewed products), with a featured/recent
 * fallback so the section is never empty for brand-new visitors.
 */
export const getPersonalizedRecommendations = async ({
  payload,
  limit,
  customerId,
  viewedProductIds,
}: Options): Promise<Product[]> => {
  const excludeIds = new Set<number>()
  let categoryIds: number[] = []

  if (customerId) {
    const { docs: orders } = await payload.find({
      collection: 'orders',
      limit: 50,
      overrideAccess: true,
      depth: 1,
      sort: '-createdAt',
      where: { customer: { equals: customerId } },
    })

    const categoryCount = new Map<number, number>()

    for (const order of orders) {
      for (const item of order.items ?? []) {
        const product = typeof item.product === 'object' ? item.product : undefined
        if (product?.id) excludeIds.add(product.id)
        for (const category of product?.categories ?? []) {
          const id = productIdOf(category)
          if (id) categoryCount.set(id, (categoryCount.get(id) ?? 0) + 1)
        }
      }
    }

    categoryIds = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  } else if (viewedProductIds?.length) {
    const numericIds = viewedProductIds.map(Number).filter((id) => !Number.isNaN(id))
    numericIds.forEach((id) => excludeIds.add(id))

    const { docs: viewedProducts } = await payload.find({
      collection: 'products',
      limit: numericIds.length,
      overrideAccess: true,
      depth: 0,
      where: { id: { in: numericIds } },
    })

    const categoryCount = new Map<number, number>()
    for (const product of viewedProducts) {
      for (const category of product.categories ?? []) {
        const id = productIdOf(category)
        if (id) categoryCount.set(id, (categoryCount.get(id) ?? 0) + 1)
      }
    }

    categoryIds = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  }

  let recommended: Product[] = []

  if (categoryIds.length > 0) {
    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      limit,
      overrideAccess: true,
      where: {
        and: [
          { categories: { in: categoryIds } },
          { id: { not_in: [...excludeIds] } },
          { stockStatus: { not_equals: 'out-of-stock' } },
        ],
      },
    })
    recommended = docs
  }

  const stillNeeded = limit - recommended.length
  if (stillNeeded <= 0) return recommended

  const excludeAll = [...excludeIds, ...recommended.map((p) => p.id)]

  const { docs: featured } = await payload.find({
    collection: 'products',
    depth: 1,
    limit: stillNeeded,
    overrideAccess: true,
    where: {
      and: [
        { featured: { equals: true } },
        { id: { not_in: excludeAll } },
        { stockStatus: { not_equals: 'out-of-stock' } },
      ],
    },
  })

  return [...recommended, ...featured]
}
