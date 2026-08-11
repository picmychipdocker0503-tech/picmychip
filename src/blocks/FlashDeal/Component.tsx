import type { FlashDealBlock as FlashDealBlockProps, Product } from '@/payload-types'

import { getAverageRatings } from '@/lib/getAverageRatings'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { FlashDealClient } from './Component.client'

export const FlashDealBlock: React.FC<
  FlashDealBlockProps & {
    id?: string | number
  }
> = async ({ title, discountBadge, endDate, populateBy, categories, selectedProducts, limit }) => {
  if (new Date(endDate).getTime() <= Date.now()) return null

  let products: Product[] = []

  if (populateBy === 'selection') {
    products = (selectedProducts ?? []).filter((product): product is Product => typeof product === 'object')
  } else {
    const flattenedCategories = (categories ?? []).map((category) =>
      typeof category === 'object' ? category.id : category,
    )

    if (flattenedCategories.length > 0) {
      const payload = await getPayload({ config: configPromise })
      const { docs } = await payload.find({
        collection: 'products',
        depth: 1,
        limit: limit || 8,
        where: { categories: { in: flattenedCategories } },
      })
      products = docs
    }
  }

  if (products.length === 0) return null

  const payload = await getPayload({ config: configPromise })
  const ratingsMap = await getAverageRatings(payload, products.map((product) => product.id))
  const ratings = Object.fromEntries(ratingsMap)

  return (
    <div className="container">
      <FlashDealClient
        discountBadge={discountBadge}
        endDate={endDate}
        products={products}
        ratings={ratings}
        title={title}
      />
    </div>
  )
}
