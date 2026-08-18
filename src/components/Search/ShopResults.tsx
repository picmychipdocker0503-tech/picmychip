'use client'

import type { Product } from '@/payload-types'

import { Grid } from '@/components/Grid'
import { Price } from '@/components/Price'
import { ProductGridItem } from '@/components/ProductGridItem'
import { ProductMatchingImage } from '@/components/product/ProductMatchingImage'
import { sorting } from '@/lib/constants'
import { useLoadMoreProducts } from '@/lib/useLoadMoreProducts'
import { useTranslations } from 'next-intl'
import { createUrl } from '@/utilities/createUrl'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { LayoutGridIcon, ListIcon, Loader2Icon, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

type Props = {
  products: Partial<Product>[]
  totalDocs: number
  ratings?: Record<number, { average: number; count: number }>
  hasNextPage?: boolean
}

export const ShopResults: React.FC<Props> = ({ products, totalDocs, ratings, hasNextPage = false }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('search')
  const { currency } = useCurrency()
  const priceField = `priceIn${currency.code}` as keyof Product
  const [view, setView] = useState<'grid' | 'list'>('grid')

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
  })

  const currentSort = searchParams.get('sort') ?? ''

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (e.target.value) params.set('sort', e.target.value)
    else params.delete('sort')

    router.push(createUrl(pathname, params))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-card/75 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 p-4 shadow-sm">
        <select
          className="rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold focus:border-primary focus:outline-none"
          onChange={handleSortChange}
          value={currentSort}
        >
          {sorting.map((item) => (
            <option key={item.title} value={item.slug ?? ''}>
              {item.title}
            </option>
          ))}
        </select>

        <span className="text-muted-foreground text-xs">
          {t('showing')} <strong className="text-foreground">{items.length}</strong> {t('of')}{' '}
          <strong className="text-foreground">{totalDocs}</strong> {t('products')}
        </span>

        <div className="flex items-center gap-1">
          <button
            aria-label={t('gridView')}
            aria-pressed={view === 'grid'}
            className={`flex size-8 items-center justify-center rounded-xl border transition-all cursor-pointer ${
              view === 'grid'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setView('grid')}
            type="button"
          >
            <LayoutGridIcon className="size-4" />
          </button>
          <button
            aria-label={t('listView')}
            aria-pressed={view === 'list'}
            className={`flex size-8 items-center justify-center rounded-xl border transition-all cursor-pointer ${
              view === 'list'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setView('list')}
            type="button"
          >
            <ListIcon className="size-4" />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-in fade-in-0 duration-300">
          {items.map((product, index) => (
            <ProductGridItem
              averageRating={product.id ? loadedRatings?.[product.id]?.average : undefined}
              key={product.id}
              priority={index < 4}
              product={product}
              reviewCount={product.id ? loadedRatings?.[product.id]?.count : undefined}
            />
          ))}
        </Grid>
      ) : (
        <ul className="animate-in fade-in-0 flex flex-col gap-3 duration-300">
          {items.map((product) => {
            const image = product.gallery?.[0]?.image
            const firstCategory =
              Array.isArray(product.categories) && product.categories[0]
                ? product.categories[0]
                : undefined

            return (
              <li key={product.id}>
                <Link
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl p-4 hover:border-primary/50 hover:bg-card hover:shadow-md transition-all"
                  href={`/products/${product.slug}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/20">
                      <ProductMatchingImage
                        category={firstCategory}
                        className="w-full h-full"
                        image={image}
                        slug={product.slug}
                        title={product.title}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {product.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                          <ShieldCheck className="size-3" />
                          Spec Verified
                        </span>
                        {product.stockStatus && (
                          <span className="text-[10px] text-muted-foreground capitalize">
                            • {product.stockStatus.replace('-', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {typeof product[priceField] === 'number' && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase text-muted-foreground block">
                        Unit Price
                      </span>
                      <span className="text-base font-extrabold text-foreground">
                        <Price amount={product[priceField] as number} />
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

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
