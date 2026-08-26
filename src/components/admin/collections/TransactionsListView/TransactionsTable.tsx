'use client'

import type { Transaction } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

// Transaction.amount is stored in paise, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

const STATUS_TONE: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  pending: 'warning',
  succeeded: 'success',
  failed: 'error',
  cancelled: 'neutral',
  expired: 'neutral',
  refunded: 'info',
}

const columnHelper = createColumnHelper<Transaction>()

const columns = [
  createSelectionColumn<Transaction>(),
  columnHelper.accessor('id', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover font-mono" href={`/admin/collections/transactions/${info.getValue()}`}>
        #{info.getValue()}
      </a>
    ),
    header: 'Transaction',
  }),
  columnHelper.display({
    cell: (info) => {
      const customer = info.row.original.customer
      const customerDoc = typeof customer === 'object' ? customer : undefined
      return <span>{customerDoc?.name || customerDoc?.email || info.row.original.customerEmail || '—'}</span>
    },
    header: 'Customer',
    id: 'customer',
  }),
  columnHelper.display({
    cell: (info) => {
      const order = info.row.original.order
      const orderDoc = typeof order === 'object' ? order : undefined
      const orderId = orderDoc?.id ?? (typeof order === 'number' ? order : undefined)
      return orderId ? (
        <a className="pmc-link pmc-link-hover font-mono" href={`/admin/collections/orders/${orderId}`}>
          #{orderId}
        </a>
      ) : (
        <span className="text-base-content/40">—</span>
      )
    },
    header: 'Order',
    id: 'order',
  }),
  columnHelper.accessor('status', {
    cell: (info) => {
      const value = info.getValue()
      return <StatusPill label={value} tone={STATUS_TONE[value] ?? 'neutral'} />
    },
    header: 'Status',
  }),
  columnHelper.accessor('amount', {
    cell: (info) => (typeof info.getValue() === 'number' ? formatCurrency(info.getValue()!) : '—'),
    header: 'Amount',
  }),
  columnHelper.accessor('paymentMethod', {
    cell: (info) => <span className="text-base-content/60 uppercase">{info.getValue() || '—'}</span>,
    header: 'Method',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, h:mm a' })}</span>
    ),
    header: 'Created',
  }),
]

export const TransactionsTable: React.FC<{ initialData: ListApiResponse<Transaction> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) => (search ? { customerEmail: { contains: search } } : undefined),
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Transaction>({
    buildWhere,
    collection: 'transactions',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No transactions match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by customer email…"
      table={table}
      toolbarRight={<BulkActionsBar collection="transactions" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
