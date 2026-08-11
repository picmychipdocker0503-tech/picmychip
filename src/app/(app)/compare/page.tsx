import type { Product } from '@/payload-types'

import { CompareChip } from '@/components/product/CompareChip'
import { ProductComparisonTable } from '@/components/product/ProductComparisonTable'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ScaleIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const MAX_COMPARE = 4

export const metadata = {
  description: 'Compare specs side by side.',
  title: 'Compare Products',
}

type Props = {
  searchParams: Promise<{ ids?: string }>
}

export default async function ComparePage({ searchParams }: Props) {
  const { ids: idsParam } = await searchParams
  const ids = (idsParam ?? '').split(',').filter(Boolean)

  if (ids.length === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <div className="bg-muted flex size-16 items-center justify-center rounded-full">
          <ScaleIcon className="text-muted-foreground size-7" />
        </div>
        <h1 className="text-2xl font-bold">Nothing to compare yet</h1>
        <p className="text-muted-foreground max-w-sm">
          Pick a couple of products from the shop and hit the scale icon on each to add them here.
        </p>
        <Link className="btn btn-primary" href="/shop">
          Browse products
        </Link>
      </div>
    )
  }

  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    where: { id: { in: ids } },
  })

  const orderedProducts = ids
    .map((id) => docs.find((doc) => String(doc.id) === id))
    .filter((doc): doc is Product => Boolean(doc))

  return (
    <div className="container flex flex-col gap-8 py-16">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compare Products</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {orderedProducts.length} of {MAX_COMPARE} products selected
          </p>
        </div>
        {orderedProducts.length < MAX_COMPARE && (
          <Link className="text-primary text-sm font-medium hover:underline" href="/shop">
            + Add another product
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {orderedProducts.map((product) => (
          <CompareChip allIds={ids} key={product.id} productId={String(product.id)} title={product.title} />
        ))}
      </div>

      <ProductComparisonTable products={orderedProducts} />
    </div>
  )
}
