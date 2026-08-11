'use client'

import type { Product } from '@/payload-types'

import { Grid } from '@/components/Grid'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { ProductGridItem } from '@/components/ProductGridItem'
import { sorting } from '@/lib/constants'
import { useLocale } from '@/providers/Locale'
import { createUrl } from '@/utilities/createUrl'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { LayoutGridIcon, ListIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

type Props = {
  products: Partial<Product>[]
  totalDocs: number
  ratings?: Record<number, { average: number; count: number }>
}

export const ShopResults: React.FC<Props> = ({ products, totalDocs, ratings }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const { currency } = useCurrency()
  const priceField = `priceIn${currency.code}` as keyof Product
  const [view, setView] = useState<'grid' | 'list'>('grid')

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
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
        <select className="select select-sm w-auto" onChange={handleSortChange} value={currentSort}>
          {sorting.map((item) => (
            <option key={item.title} value={item.slug ?? ''}>
              {item.title}
            </option>
          ))}
        </select>

        <span className="text-muted-foreground text-sm">
          {t('showing')} {products.length} {t('of')} {totalDocs} {t('products')}
        </span>

        <div className="flex items-center gap-1">
          <button
            aria-label={t('gridView')}
            aria-pressed={view === 'grid'}
            className={`btn btn-square btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('grid')}
            type="button"
          >
            <LayoutGridIcon className="size-4" />
          </button>
          <button
            aria-label={t('listView')}
            aria-pressed={view === 'list'}
            className={`btn btn-square btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('list')}
            type="button"
          >
            <ListIcon className="size-4" />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in-0 duration-500">
          {products.map((product) => (
            <ProductGridItem
              averageRating={product.id ? ratings?.[product.id]?.average : undefined}
              key={product.id}
              product={product}
              reviewCount={product.id ? ratings?.[product.id]?.count : undefined}
            />
          ))}
        </Grid>
      ) : (
        <ul className="animate-in fade-in-0 flex flex-col gap-4 duration-500">
          {products.map((product) => {
            const image = product.gallery?.[0]?.image
            return (
              <li key={product.id}>
                <Link
                  className="card-hover bg-card flex items-center gap-4 rounded-2xl border border-border p-4"
                  href={`/products/${product.slug}`}
                >
                  <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-xl">
                    {image && typeof image === 'object' && (
                      <Media fill imgClassName="object-cover" resource={image} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{product.title}</div>
                    {typeof product[priceField] === 'number' && (
                      <div className="text-foreground mt-1 font-semibold">
                        <Price amount={product[priceField] as number} />
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
