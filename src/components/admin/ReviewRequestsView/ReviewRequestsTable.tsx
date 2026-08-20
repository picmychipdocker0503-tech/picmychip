'use client'

import type { Order } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { formatDateTime } from '@/utilities/formatDateTime'
import { toast } from '@payloadcms/ui'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
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

  const rows = table.getRowModel().rows
  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="pmc-input pmc-input-sm w-full max-w-xs"
          onChange={(e) => {
            setQuery(e.target.value)
            table.setPageIndex(0)
          }}
          placeholder="Search by customer name or email…"
          type="text"
          value={query}
        />
        <div className="flex items-center gap-3">
          <span className="text-base-content/60 text-sm">
            {totalFiltered} order{totalFiltered === 1 ? '' : 's'}
          </span>
          <button
            className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full"
            disabled={sending}
            onClick={handleSendNow}
            type="button"
          >
            {sending ? 'Sending…' : 'Send review requests now'}
          </button>
        </div>
      </div>

      <div className="border-base-content/10 pmc-rounded-box overflow-x-auto border">
        <table className="pmc-table pmc-table-zebra">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className="text-base-content/70" key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortDirection = header.column.getIsSorted()

                  return (
                    <th key={header.id}>
                      {header.column.getCanSort() ? (
                        <button
                          className="flex cursor-pointer items-center gap-1 select-none"
                          onClick={header.column.getToggleSortingHandler()}
                          type="button"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection === 'asc' && <ArrowUpIcon className="size-3" />}
                          {sortDirection === 'desc' && <ArrowDownIcon className="size-3" />}
                          {!sortDirection && <ArrowUpDownIcon className="size-3 opacity-30" />}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="text-base-content/50" colSpan={columns.length}>
                  {orders.length === 0 ? 'No orders eligible for a review request right now.' : `No orders match "${query}".`}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-base-content/60 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="pmc-btn pmc-btn-ghost pmc-btn-sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              type="button"
            >
              <ChevronLeftIcon className="size-4" />
              Prev
            </button>
            <button
              className="pmc-btn pmc-btn-ghost pmc-btn-sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              type="button"
            >
              Next
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
