import type { ComparisonTableBlock as ComparisonTableBlockProps, Product } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ProductComparisonTable } from '@/components/product/ProductComparisonTable'

export const ComparisonTableBlock: React.FC<
  ComparisonTableBlockProps & {
    id?: string | number
    className?: string
  }
> = async ({ heading, products }) => {
  const ids = (products ?? []).map((product) => (typeof product === 'object' ? product.id : product))

  if (ids.length === 0) return null

  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    where: { id: { in: ids } },
  })

  const orderedProducts = ids
    .map((id) => docs.find((doc) => doc.id === id))
    .filter((doc): doc is Product => Boolean(doc))

  return (
    <div className="container">
      <ProductComparisonTable heading={heading ?? undefined} products={orderedProducts} />
    </div>
  )
}
