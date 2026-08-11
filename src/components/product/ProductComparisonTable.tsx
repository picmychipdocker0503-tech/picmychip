import type { Product } from '@/payload-types'
import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/cn'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getGeneralComparisonRows, getSpecRows } from '@/components/product/specTableRows'

type Props = {
  products: Product[]
  heading?: string
}

/**
 * Given already-fetched product docs, renders a union-of-spec-labels
 * comparison table. Shared by the CMS `ComparisonTable` block and the
 * interactive `/compare` page so the row/label logic never drifts between
 * the two. Always includes the baseline rows (brand/category/price/stock)
 * so real-catalog products — which have no `specSchemaType` — still show a
 * useful comparison, not an empty table.
 */
export const ProductComparisonTable: React.FC<Props> = ({ products, heading }) => {
  const rowsByProduct = products.map((product) => [
    ...getGeneralComparisonRows(product),
    ...getSpecRows(product),
  ])

  const labels: string[] = []
  rowsByProduct.forEach((rows) => {
    rows.forEach((row) => {
      if (!labels.includes(row.label)) labels.push(row.label)
    })
  })

  if (labels.length === 0) return null

  return (
    <div>
      {heading && <h2 className="mb-6 text-2xl font-semibold">{heading}</h2>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Spec</TableHead>
            {products.map((product) => {
              const image = product.gallery?.[0]?.image
              return (
                <TableHead key={product.id} className="min-w-[10rem]">
                  <Link className="flex flex-col items-start gap-2 hover:text-primary" href={`/products/${product.slug}`}>
                    {image && typeof image === 'object' && (
                      <div className="bg-muted relative size-16 overflow-hidden rounded-lg border border-border">
                        <Media fill imgClassName="object-cover" resource={image} />
                      </div>
                    )}
                    <span className="font-semibold">{product.title}</span>
                  </Link>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {labels.map((label) => {
            const values = rowsByProduct.map(
              (rows) => rows.find((row) => row.label === label)?.value ?? '—',
            )
            const differs = products.length > 1 && values.some((value) => value !== values[0])

            return (
              <TableRow key={label}>
                <TableCell className="font-medium">{label}</TableCell>
                {values.map((value, index) => (
                  <TableCell
                    key={products[index]!.id}
                    className={cn(differs && 'bg-warning/15 font-medium')}
                  >
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
