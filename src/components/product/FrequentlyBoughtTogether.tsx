'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  mainProduct: Product
  companions: Product[]
}

export const FrequentlyBoughtTogether: React.FC<Props> = ({ mainProduct, companions }) => {
  const { currency } = useCurrency()
  const { addItem, isLoading } = useCart()

  const items = useMemo(() => [mainProduct, ...companions], [mainProduct, companions])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(items.map((item) => item.id)))
  const [justAdded, setJustAdded] = useState(false)

  const priceField = `priceIn${currency.code}` as keyof Product

  const toggle = (id: number) => {
    if (id === mainProduct.id) return // this product is always included
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedItems = items.filter((item) => selectedIds.has(item.id))
  const total = selectedItems.reduce((sum, item) => {
    const price = item[priceField] as number | null | undefined
    return sum + (typeof price === 'number' ? price : 0)
  }, 0)

  const handleAddAll = () => {
    Promise.all(selectedItems.map((item) => addItem({ product: item.id }))).then(() => {
      setJustAdded(true)
      window.setTimeout(() => setJustAdded(false), 1500)
      toast.success(`${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'} added to cart.`)
    })
  }

  if (companions.length === 0) return null

  return (
    <div className="bg-card border-border rounded-2xl border p-6 sm:p-8">
      <h2 className="mb-6 text-xl font-semibold tracking-tight sm:text-2xl">Frequently Bought Together</h2>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {items.map((item, index) => {
            const image = item.gallery?.[0]?.image && typeof item.gallery[0]?.image === 'object' ? item.gallery[0].image : undefined
            const isMain = item.id === mainProduct.id
            const checked = selectedIds.has(item.id)

            return (
              <React.Fragment key={item.id}>
                {index > 0 && <PlusIcon className="text-muted-foreground size-4 shrink-0" />}
                <label className="flex w-24 flex-col items-center gap-2 text-center">
                  <div
                    className={`bg-muted relative aspect-square w-20 overflow-hidden rounded-lg border-2 transition-opacity ${checked ? 'border-primary' : 'border-transparent opacity-50'}`}
                  >
                    {image && <Media className="relative h-full w-full" fill imgClassName="object-contain" resource={image} />}
                  </div>
                  <input checked={checked} className="accent-primary" disabled={isMain} onChange={() => toggle(item.id)} type="checkbox" />
                  <Link className="text-foreground line-clamp-2 text-xs hover:underline" href={`/products/${item.slug}`}>
                    {item.title}
                  </Link>
                  {typeof item[priceField] === 'number' && (
                    <span className="text-muted-foreground text-xs font-medium">
                      <Price amount={item[priceField] as number} as="span" />
                    </span>
                  )}
                </label>
              </React.Fragment>
            )
          })}
        </div>

        <div className="border-border flex shrink-0 flex-col items-start gap-3 border-t pt-4 lg:items-end lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <p className="text-sm">
            <span className="text-muted-foreground">Total for {selectedItems.length} items: </span>
            <span className="text-lg font-bold">
              <Price amount={total} as="span" />
            </span>
          </p>
          <button
            className="btn btn-primary"
            disabled={isLoading || selectedItems.length === 0}
            onClick={handleAddAll}
            type="button"
          >
            {justAdded ? 'Added!' : 'Add selected to cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
