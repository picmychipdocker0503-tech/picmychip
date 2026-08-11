'use client'

import type { Product } from '@/payload-types'

import { CountdownTimer } from '@/components/CountdownTimer'
import { DealProductCard } from '@/components/product/DealProductCard'
import { ZapIcon } from 'lucide-react'
import React, { useState } from 'react'

type Props = {
  title: string
  discountBadge?: string | null
  endDate: string
  products: Product[]
  ratings?: Record<number, { average: number; count: number }>
}

export const FlashDealClient: React.FC<Props> = ({ title, discountBadge, endDate, products, ratings }) => {
  const [expired, setExpired] = useState(false)

  if (expired) return null

  return (
    <div className="bg-card border-border rounded-2xl border p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ZapIcon className="text-primary size-6" />
          <h2 className="text-2xl font-bold">{title}</h2>
          {discountBadge && (
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
              {discountBadge}
            </span>
          )}
        </div>
        <CountdownTimer endDate={endDate} onExpire={() => setExpired(true)} />
      </div>

      <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((product) => (
          <div className="w-[70%] shrink-0 snap-start sm:w-auto" key={product.id}>
            <DealProductCard
              averageRating={ratings?.[product.id]?.average}
              product={product}
              reviewCount={ratings?.[product.id]?.count}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
