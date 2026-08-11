import * as React from 'react'

import { cn } from '@/components/pmc-ui/lib/cn'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@/components/pmc-ui/primitives/Table'

export interface CompareTableProduct {
  id: string
  title: string
  imageUrl?: string
  href?: string
}

export interface CompareTableSpec {
  label: string
  values: Record<string, React.ReactNode>
}

export interface CompareTableProps {
  products: CompareTableProduct[]
  specs: CompareTableSpec[]
  highlightDifferences?: boolean
  className?: string
}

export function CompareTable({ products, specs, highlightDifferences = true, className }: CompareTableProps) {
  return (
    <Table className={className}>
      <TableHead sticky>
        <tr>
          <TableHeaderCell scope="col">Specification</TableHeaderCell>
          {products.map((product) => (
            <TableHeaderCell key={product.id} scope="col" className="min-w-[10rem]">
              <div className="flex flex-col gap-2">
                {product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="size-12 rounded object-contain" />
                )}
                {product.href ? (
                  <a href={product.href} className="font-medium normal-case text-pmc-blue-700">
                    {product.title}
                  </a>
                ) : (
                  <span className="font-medium normal-case text-pmc-ink-900">{product.title}</span>
                )}
              </div>
            </TableHeaderCell>
          ))}
        </tr>
      </TableHead>
      <TableBody>
        {specs.map((spec) => {
          const values = products.map((p) => spec.values[p.id])
          const allSame = values.every((v) => v === values[0])
          return (
            <TableRow key={spec.label}>
              <TableCell className="font-medium text-pmc-ink-700">{spec.label}</TableCell>
              {products.map((product) => (
                <TableCell
                  key={product.id}
                  className={cn(
                    highlightDifferences && !allSame && 'bg-pmc-orange-50 font-medium text-pmc-orange-800',
                  )}
                >
                  {spec.values[product.id] ?? '—'}
                </TableCell>
              ))}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
