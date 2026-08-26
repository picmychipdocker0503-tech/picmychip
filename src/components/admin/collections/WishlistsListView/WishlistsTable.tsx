'use client'

import type { Wishlist } from '@/payload-types'

import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

// Wishlist.priceAtAdd is stored in paise, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

const columnHelper = createColumnHelper<Wishlist>()

const columns = [
  createSelectionColumn<Wishlist>(),
  columnHelper.display({
    cell: (info) => {
      const customer = info.row.original.customer
      const customerDoc = typeof customer === 'object' ? customer : undefined
      return customerDoc ? (
        <a className="pmc-link pmc-link-hover" href={`/admin/collections/users/${customerDoc.id}`}>
          {customerDoc.name || customerDoc.email}
        </a>
      ) : (
        <span className="text-base-content/40">—</span>
      )
    },
    header: 'Customer',
    id: 'customer',
  }),
  columnHelper.display({
    cell: (info) => {
      const product = info.row.original.product
      const productDoc = typeof product === 'object' ? product : undefined
      return productDoc ? (
        <a className="pmc-link pmc-link-hover" href={`/admin/collections/products/${productDoc.id}`}>
          {productDoc.title}
        </a>
      ) : (
        <span className="text-base-content/40">—</span>
      )
    },
    header: 'Product',
    id: 'product',
  }),
  columnHelper.accessor('priceAtAdd', {
    cell: (info) => (typeof info.getValue() === 'number' ? formatCurrency(info.getValue()!) : '—'),
    header: 'Price when saved',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Saved',
  }),
]

export const WishlistsTable: React.FC<{ initialData: ListApiResponse<Wishlist> }> = ({ initialData }) => {
  const { data, isLoading, refetch, table } = useServerTable<Wishlist>({
    collection: 'wishlists',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No wishlist items yet."
      isLoading={isLoading}
      table={table}
      toolbarRight={<BulkActionsBar collection="wishlists" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
