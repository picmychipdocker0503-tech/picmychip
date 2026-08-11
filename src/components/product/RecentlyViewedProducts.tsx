'use client'

import type { Product } from '@/payload-types'

import { ProductGridItem } from '@/components/ProductGridItem'
import { useRecentlyViewed } from '@/providers/RecentlyViewed'
import { getClientSideURL } from '@/utilities/getURL'
import React, { useEffect, useState } from 'react'

type Props = {
  excludeProductId?: string
}

export const RecentlyViewedProducts: React.FC<Props> = ({ excludeProductId }) => {
  const { ids } = useRecentlyViewed()
  const [products, setProducts] = useState<Product[]>([])

  const filteredIds = ids.filter((id) => id !== excludeProductId)

  useEffect(() => {
    if (filteredIds.length === 0) {
      setProducts([])
      return
    }

    const query = filteredIds.map((id) => `where[id][in][]=${id}`).join('&')

    fetch(`${getClientSideURL()}/api/products?${query}&depth=1&limit=${filteredIds.length}`, {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        const docs: Product[] = data?.docs ?? []
        // Preserve most-recently-viewed-first order (API doesn't guarantee it).
        const bySlugOrder = filteredIds
          .map((id) => docs.find((doc) => String(doc.id) === id))
          .filter((doc): doc is Product => Boolean(doc))
        setProducts(bySlugOrder)
      })
      .catch(() => setProducts([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredIds.join(',')])

  if (products.length === 0) return null

  return (
    <div className="container my-16">
      <h2 className="mb-6 text-2xl font-bold text-foreground">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <div className="aspect-[3/4] w-48 shrink-0" key={product.id}>
            <ProductGridItem product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
