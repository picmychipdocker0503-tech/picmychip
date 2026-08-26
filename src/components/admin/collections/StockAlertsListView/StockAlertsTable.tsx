'use client'

import type { StockAlert } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<StockAlert>()

const columns = [
  createSelectionColumn<StockAlert>(),
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
  columnHelper.accessor('email', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/stock-alerts/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Email',
  }),
  columnHelper.accessor('notifiedAt', {
    cell: (info) =>
      info.getValue() ? (
        <StatusPill label="Notified" tone="success" />
      ) : (
        <StatusPill label="Pending" tone="warning" />
      ),
    header: 'Status',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Requested',
  }),
]

export const StockAlertsTable: React.FC<{ initialData: ListApiResponse<StockAlert> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) => (search ? { email: { contains: search } } : undefined),
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<StockAlert>({
    buildWhere,
    collection: 'stock-alerts',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No stock alerts match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by email…"
      table={table}
      toolbarRight={<BulkActionsBar collection="stock-alerts" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
