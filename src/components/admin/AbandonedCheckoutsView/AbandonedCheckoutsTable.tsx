'use client'

import type { Cart } from '@/payload-types'

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
  carts: Cart[]
}

// Money fields (cart.subtotal, etc.) are stored in paise — divide by 100
// before formatting, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

const getCustomerLabel = (cart: Cart) => {
  const customer = typeof cart.customer === 'object' ? cart.customer : undefined
  return customer?.name || customer?.email || `Customer #${cart.customer}`
}

const columnHelper = createColumnHelper<Cart>()

const columns = [
  columnHelper.accessor((cart) => getCustomerLabel(cart), {
    id: 'customer',
    cell: (info) => {
      const cart = info.row.original
      const customer = typeof cart.customer === 'object' ? cart.customer : undefined
      return (
        <a className="pmc-link pmc-link-hover" href={`/admin/collections/users/${customer?.id ?? ''}`}>
          {info.getValue()}
        </a>
      )
    },
    header: 'Customer',
  }),
  columnHelper.accessor((cart) => cart.items?.length ?? 0, {
    id: 'items',
    header: 'Items',
  }),
  columnHelper.accessor((cart) => cart.subtotal ?? 0, {
    id: 'subtotal',
    cell: (info) => (typeof info.row.original.subtotal === 'number' ? formatCurrency(info.row.original.subtotal) : '—'),
    header: 'Subtotal',
  }),
  columnHelper.accessor('updatedAt', {
    id: 'updatedAt',
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, h:mm a' })}</span>
    ),
    header: 'Last activity',
  }),
  columnHelper.accessor((cart) => Boolean(cart.abandonedRecoveryEmailSentAt), {
    id: 'recovery',
    cell: (info) =>
      info.getValue() ? <StatusPill label="Emailed" tone="success" /> : <StatusPill label="Not contacted" tone="warning" />,
    header: 'Recovery',
  }),
]

export const AbandonedCheckoutsTable: React.FC<Props> = ({ carts }) => {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [query, setQuery] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const handleSendNow = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/admin/send-abandoned-cart-emails', { method: 'POST' })
      if (!response.ok) throw new Error('Request failed')
      const result: { sent: number; checked: number } = await response.json()
      toast.success(`Sent ${result.sent} recovery email${result.sent === 1 ? '' : 's'} (${result.checked} carts checked).`)
      router.refresh()
    } catch {
      toast.error('Failed to send recovery emails — please retry.')
    } finally {
      setSending(false)
    }
  }

  const table = useReactTable({
    columns,
    data: carts,
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
            {totalFiltered} checkout{totalFiltered === 1 ? '' : 's'}
          </span>
          <button
            className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full"
            disabled={sending}
            onClick={handleSendNow}
            type="button"
          >
            {sending ? 'Sending…' : 'Send recovery emails now'}
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
                  {carts.length === 0 ? 'No abandoned checkouts right now.' : `No checkouts match "${query}".`}
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
