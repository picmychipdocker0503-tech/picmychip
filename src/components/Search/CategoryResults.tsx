'use client'

import type { Product } from '@/payload-types'

import { Grid } from '@/components/Grid'
import { DealProductCard } from '@/components/product/DealProductCard'
import { MobileDealProductCard } from '@/components/product/MobileDealProductCard'
import { useLoadMoreProducts } from '@/lib/useLoadMoreProducts'
import { useTranslations } from 'next-intl'
import { Loader2Icon } from 'lucide-react'
import React from 'react'

type Props = {
  products: Partial<Product>[]
  totalDocs: number
  ratings?: Record<number, { average: number; count: number }>
  hasNextPage?: boolean
  categoryId: string
}

export const CategoryResults: React.FC<Props> = ({
  products,
  totalDocs,
  ratings,
  hasNextPage = false,
  categoryId,
}) => {
  const t = useTranslations('search')
  const {
    items,
    ratings: loadedRatings,
    hasNextPage: canLoadMore,
    isLoading,
    loadMore,
  } = useLoadMoreProducts({
    initialDocs: products,
    initialRatings: ratings ?? {},
    initialHasNextPage: hasNextPage,
    totalDocs,
    extraParams: { category: categoryId },
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Desktop/tablet */}
      <Grid className="hidden md:grid md:grid-cols-4 gap-4 animate-in fade-in-0 duration-500">
        {items.map((product, index) => (
          <DealProductCard
            averageRating={product.id ? loadedRatings?.[product.id]?.average : undefined}
            key={product.id}
            priority={index < 4}
            product={product}
            reviewCount={product.id ? loadedRatings?.[product.id]?.count : undefined}
          />
        ))}
      </Grid>

      {/* Mobile — MobileDealProductCard instead of the desktop card squeezed to fit */}
      <Grid className="grid-cols-2 gap-4 animate-in fade-in-0 duration-500 md:hidden">
        {items.map((product, index) => (
          <MobileDealProductCard
            averageRating={product.id ? loadedRatings?.[product.id]?.average : undefined}
            key={product.id}
            priority={index < 4}
            product={product}
            reviewCount={product.id ? loadedRatings?.[product.id]?.count : undefined}
          />
        ))}
      </Grid>

      {canLoadMore && (
        <div className="flex justify-center mt-4">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-60 cursor-pointer"
            disabled={isLoading}
            onClick={loadMore}
            type="button"
          >
            {isLoading && <Loader2Icon className="size-4 animate-spin" />}
            {isLoading ? 'Loading…' : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}
