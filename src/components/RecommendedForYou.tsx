'use client'

import type { Product } from '@/payload-types'

import { DealProductCard } from '@/components/product/DealProductCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { useAuth } from '@/providers/Auth'
import { useRecentlyViewed } from '@/providers/RecentlyViewed'
import { getClientSideURL } from '@/utilities/getURL'
import React, { useEffect, useState } from 'react'

type RatedProduct = Product & { averageRating?: number; reviewCount?: number }

export const RecommendedForYou: React.FC = () => {
  const { user } = useAuth()
  const { ids } = useRecentlyViewed()
  const [products, setProducts] = useState<RatedProduct[]>([])

  useEffect(() => {
    // Wait for the initial auth check so guests don't get a logged-in fetch
    // then immediately refetch once `user` resolves (avoids a layout flash).
    if (user === undefined) return

    const query = new URLSearchParams({ limit: '8' })
    if (!user && ids.length > 0) query.set('ids', ids.join(','))

    fetch(`${getClientSideURL()}/api/recommendations?${query.toString()}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setProducts(data?.products ?? []))
      .catch(() => setProducts([]))
  }, [user, ids])

  if (products.length === 0) return null

  return (
    <div className="container my-20">
      <span className="eyebrow">For You</span>
      <h2 className="mt-2 mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
        Recommended for You
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.map((product, index) => (
          <ScrollReveal className="h-full" index={index} key={product.id} staggerMs={50}>
            <DealProductCard
              averageRating={product.averageRating}
              product={product}
              reviewCount={product.reviewCount}
            />
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}
