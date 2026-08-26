'use client'

import type { Order } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

// Order.amount is stored in paise, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

const STATUS_TONE: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  processing: 'warning',
  completed: 'success',
  cancelled: 'error',
  refunded: 'info',
}

const columnHelper = createColumnHelper<Order>()

const columns = [
  createSelectionColumn<Order>(),
  columnHelper.accessor('id', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover font-mono" href={`/admin/collections/orders/${info.getValue()}`}>
        #{info.getValue()}
      </a>
    ),
    header: 'Order',
  }),
  columnHelper.display({
    cell: (info) => {
      const customer = info.row.original.customer
      const customerDoc = typeof customer === 'object' ? customer : undefined
      return (
        <span>
          {customerDoc?.name || customerDoc?.email || info.row.original.customerEmail || '—'}
        </span>
      )
    },
    header: 'Customer',
    id: 'customer',
  }),
  columnHelper.accessor('status', {
    cell: (info) => {
      const value = info.getValue() || 'processing'
      return <StatusPill label={value} tone={STATUS_TONE[value] ?? 'neutral'} />
    },
    header: 'Status',
  }),
  columnHelper.accessor('amount', {
    cell: (info) => (typeof info.getValue() === 'number' ? formatCurrency(info.getValue()!) : '—'),
    header: 'Amount',
  }),
  columnHelper.accessor('paymentMethod', {
    cell: (info) => <span className="text-base-content/60 capitalize">{info.getValue() || '—'}</span>,
    header: 'Payment',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, h:mm a' })}</span>
    ),
    header: 'Placed',
  }),
]

export const OrdersTable: React.FC<{ initialData: ListApiResponse<Order> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) => (search ? { customerEmail: { contains: search } } : undefined),
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Order>({
    buildWhere,
    collection: 'orders',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No orders match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by customer email…"
      table={table}
      toolbarRight={<BulkActionsBar collection="orders" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
