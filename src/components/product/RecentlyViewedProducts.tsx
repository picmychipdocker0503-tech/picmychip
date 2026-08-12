'use client'

import type { Product } from '@/payload-types'

import { DealProductCard } from '@/components/product/DealProductCard'
import { useRecentlyViewed } from '@/providers/RecentlyViewed'
import { getClientSideURL } from '@/utilities/getURL'
import { HistoryIcon } from 'lucide-react'
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
    <div className="container my-20">
      <span className="eyebrow inline-flex items-center gap-1.5">
        <HistoryIcon className="size-3.5" />
        Pick Up Where You Left Off
      </span>
      <h2 className="mt-2 mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        Recently Viewed
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <div className="w-56 shrink-0" key={product.id}>
            <DealProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
