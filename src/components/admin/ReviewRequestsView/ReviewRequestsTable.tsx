'use client'

import type { Order } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { formatDateTime } from '@/utilities/formatDateTime'
import { toast } from '@payloadcms/ui'
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type Props = {
  orders: Order[]
}

const getCustomerLabel = (order: Order) => {
  const customer = typeof order.customer === 'object' ? order.customer : undefined
  return customer?.name || order.customerEmail || `Order #${order.id}`
}

const columnHelper = createColumnHelper<Order>()

const columns = [
  columnHelper.accessor((order) => order.id, {
    id: 'order',
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/orders/${info.getValue()}`}>
        #{info.getValue()}
      </a>
    ),
    header: 'Order',
  }),
  columnHelper.accessor((order) => getCustomerLabel(order), {
    id: 'customer',
    header: 'Customer',
  }),
  columnHelper.accessor((order) => order.customerEmail ?? '', {
    id: 'email',
    cell: (info) => <span className="text-base-content/60">{info.getValue()}</span>,
    header: 'Email',
  }),
  columnHelper.accessor('updatedAt', {
    id: 'updatedAt',
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, h:mm a' })}</span>
    ),
    header: 'Completed',
  }),
  columnHelper.accessor((order) => Boolean(order.reviewRequestSentAt), {
    id: 'requested',
    cell: (info) =>
      info.getValue() ? <StatusPill label="Emailed" tone="success" /> : <StatusPill label="Not contacted" tone="warning" />,
    header: 'Review request',
  }),
]

export const ReviewRequestsTable: React.FC<Props> = ({ orders }) => {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [query, setQuery] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const handleSendNow = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/admin/send-review-request-emails', { method: 'POST' })
      if (!response.ok) throw new Error('Request failed')
      const result: { sent: number; checked: number } = await response.json()
      toast.success(`Sent ${result.sent} review request${result.sent === 1 ? '' : 's'} (${result.checked} orders checked).`)
      router.refresh()
    } catch {
      toast.error('Failed to send review requests — please retry.')
    } finally {
      setSending(false)
    }
  }

  const table = useReactTable({
    columns,
    data: orders,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      getCustomerLabel(row.original).toLowerCase().includes(String(filterValue).toLowerCase()),
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 20 } },
    state: { globalFilter: query, sorting },
  })

  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <DataTableShell
      emptyMessage={orders.length === 0 ? 'No orders eligible for a review request right now.' : `No orders match "${query}".`}
      onSearchChange={(value) => {
        setQuery(value)
        table.setPageIndex(0)
      }}
      searchInput={query}
      searchPlaceholder="Search by customer name or email…"
      table={table}
      toolbarRight={
        <button
          className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full"
          disabled={sending}
          onClick={handleSendNow}
          type="button"
        >
          {sending ? 'Sending…' : 'Send review requests now'}
        </button>
      }
      totalDocs={totalFiltered}
    />
  )
}
