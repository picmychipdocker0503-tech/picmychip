'use client'

import type { Cart } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

// Cart.subtotal is stored in paise, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'neutral',
  purchased: 'success',
  abandoned: 'warning',
}

const columnHelper = createColumnHelper<Cart>()

const columns = [
  createSelectionColumn<Cart>(),
  columnHelper.display({
    cell: (info) => {
      const customer = info.row.original.customer
      const customerDoc = typeof customer === 'object' ? customer : undefined
      return customerDoc ? (
        <a className="pmc-link pmc-link-hover" href={`/admin/collections/users/${customerDoc.id}`}>
          {customerDoc.name || customerDoc.email}
        </a>
      ) : (
        <span className="text-base-content/40">Guest</span>
      )
    },
    header: 'Customer',
    id: 'customer',
  }),
  columnHelper.accessor((cart) => cart.items?.length ?? 0, {
    id: 'items',
    header: 'Items',
  }),
  columnHelper.accessor('subtotal', {
    cell: (info) => (typeof info.getValue() === 'number' ? formatCurrency(info.getValue()!) : '—'),
    header: 'Subtotal',
  }),
  columnHelper.accessor('status', {
    cell: (info) => {
      const value = info.getValue() || 'active'
      return <StatusPill label={value} tone={STATUS_TONE[value] ?? 'neutral'} />
    },
    header: 'Status',
  }),
  columnHelper.accessor('updatedAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, h:mm a' })}</span>
    ),
    header: 'Last activity',
  }),
]

export const CartsTable: React.FC<{ initialData: ListApiResponse<Cart> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) => (search ? { 'customer.email': { contains: search } } : undefined),
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Cart>({
    buildWhere,
    collection: 'carts',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No carts match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by customer email…"
      table={table}
      toolbarRight={<BulkActionsBar collection="carts" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
