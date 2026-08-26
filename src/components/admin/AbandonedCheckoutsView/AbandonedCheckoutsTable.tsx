'use client'

import type { Cart } from '@/payload-types'

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

  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <DataTableShell
      emptyMessage={carts.length === 0 ? 'No abandoned checkouts right now.' : `No checkouts match "${query}".`}
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
          {sending ? 'Sending…' : 'Send recovery emails now'}
        </button>
      }
      totalDocs={totalFiltered}
    />
  )
}
