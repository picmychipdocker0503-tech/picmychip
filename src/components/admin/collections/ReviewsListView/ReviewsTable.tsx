'use client'

import type { Review } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<Review>()

const STATUS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
}

const columns = [
  createSelectionColumn<Review>(),
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
    enableSorting: false,
    header: 'Product',
    id: 'product',
  }),
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
    enableSorting: false,
    header: 'Customer',
    id: 'customer',
  }),
  columnHelper.accessor('rating', {
    cell: (info) => <span className="font-medium">{info.getValue()} / 5</span>,
    header: 'Rating',
  }),
  columnHelper.accessor('comment', {
    cell: (info) => <span className="text-base-content/60 line-clamp-1 max-w-xs">{info.getValue() || '—'}</span>,
    enableSorting: false,
    header: 'Comment',
  }),
  columnHelper.accessor('status', {
    cell: (info) => {
      const status = info.getValue() ?? 'pending'
      return <StatusPill label={status} tone={STATUS_TONE[status] ?? 'neutral'} />
    },
    header: 'Status',
  }),
  columnHelper.accessor('verifiedPurchase', {
    cell: (info) =>
      info.getValue() ? (
        <StatusPill label="Verified" tone="success" />
      ) : (
        <span className="text-base-content/40">—</span>
      ),
    header: 'Verified',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Created',
  }),
]

export const ReviewsTable: React.FC<{ initialData: ListApiResponse<Review> }> = ({ initialData }) => {
  const buildWhere = useCallback((search: string) => (search ? { comment: { contains: search } } : undefined), [])

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Review>({
    buildWhere,
    collection: 'reviews',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No reviews match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by comment…"
      table={table}
      toolbarRight={
        <div className="flex items-center gap-3">
          <BulkActionsBar collection="reviews" onDeleted={refetch} table={table} />
          <a className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full" href="/admin/collections/reviews/create">
            <PlusIcon className="size-4" />
            Create New
          </a>
        </div>
      }
      totalDocs={data.totalDocs}
    />
  )
}
