'use client'

import type { Product } from '@/payload-types'

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
import { toast } from '@payloadcms/ui'
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, SaveIcon } from 'lucide-react'
import React, { useMemo, useState } from 'react'

type Row = Pick<Product, 'id' | 'title' | 'slug' | 'priceInINR' | 'inventory' | 'lowStockThreshold' | 'stockStatus'>

type Edits = Record<number, Partial<Pick<Row, 'priceInINR' | 'inventory' | 'lowStockThreshold'>>>

type TableMeta = {
  edits: Edits
  updateField: (id: number, field: keyof Edits[number], value: number) => void
}

const STOCK_BADGE: Record<string, string> = {
  'in-stock': 'pmc-badge-success',
  'low-stock': 'pmc-badge-warning',
  'out-of-stock': 'pmc-badge-error',
  backorder: 'pmc-badge-warning',
}

const columnHelper = createColumnHelper<Row>()

const NumberCell: React.FC<{
  field: keyof Edits[number]
  row: Row
  meta: TableMeta
  width: string
}> = ({ field, row, meta, width }) => {
  const edit = meta.edits[row.id]
  const fallback = field === 'lowStockThreshold' ? 5 : 0

  return (
    <input
      className={`pmc-input pmc-input-sm ${width}`}
      onChange={(e) => meta.updateField(row.id, field, Number(e.target.value))}
      type="number"
      value={edit?.[field] ?? row[field] ?? fallback}
    />
  )
}

const columns = [
  columnHelper.accessor('title', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/products/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Title',
  }),
  columnHelper.accessor('slug', {
    cell: (info) => <span className="text-base-content/60 font-mono text-xs">{info.getValue()}</span>,
    enableSorting: false,
    header: 'Slug',
  }),
  columnHelper.accessor('priceInINR', {
    cell: (info) => (
      <NumberCell field="priceInINR" meta={info.table.options.meta as TableMeta} row={info.row.original} width="w-24" />
    ),
    header: 'Price (INR)',
  }),
  columnHelper.accessor('inventory', {
    cell: (info) => (
      <NumberCell field="inventory" meta={info.table.options.meta as TableMeta} row={info.row.original} width="w-20" />
    ),
    header: 'Inventory',
  }),
  columnHelper.accessor('lowStockThreshold', {
    cell: (info) => (
      <NumberCell
        field="lowStockThreshold"
        meta={info.table.options.meta as TableMeta}
        row={info.row.original}
        width="w-20"
      />
    ),
    header: 'Low Stock Threshold',
  }),
  columnHelper.accessor('stockStatus', {
    cell: (info) => {
      const status = info.getValue()
      const badgeClass = STOCK_BADGE[status ?? ''] ?? 'pmc-badge-ghost'
      return <span className={`pmc-badge ${badgeClass} pmc-badge-sm whitespace-nowrap`}>{status}</span>
    },
    header: 'Status',
  }),
]

export const BulkStockTable: React.FC<{ products: Row[] }> = ({ products }) => {
  const [query, setQuery] = useState('')
  const [edits, setEdits] = useState<Edits>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [saving, setSaving] = useState(false)

  const dirtyCount = Object.keys(edits).length

  const updateField = (id: number, field: keyof Edits[number], value: number) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const meta = useMemo<TableMeta>(() => ({ edits, updateField }), [edits])

  const table = useReactTable({
    columns,
    data: products,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      (row.original.title ?? '').toLowerCase().includes(String(filterValue).toLowerCase()),
    initialState: { pagination: { pageSize: 25 } },
    meta,
    onSortingChange: setSorting,
    state: { globalFilter: query, sorting },
  })

  const saveAll = async () => {
    setSaving(true)
    const entries = Object.entries(edits)
    let succeeded = 0

    for (const [id, changes] of entries) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          body: JSON.stringify(changes),
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        })
        if (response.ok) succeeded += 1
      } catch {
        // counted via succeeded < entries.length below
      }
    }

    setSaving(false)

    if (succeeded === entries.length) {
      toast.success(`Saved ${succeeded} product${succeeded === 1 ? '' : 's'}.`)
      setEdits({})
    } else {
      toast.error(`Saved ${succeeded} of ${entries.length} — some updates failed, please retry.`)
    }
  }

  const rows = table.getRowModel().rows
  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <div className="border-base-content/10 bg-base-100/40 pmc-rounded-box flex flex-col gap-4 border p-5 shadow-md backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="pmc-input pmc-input-sm w-full max-w-xs"
          onChange={(e) => {
            setQuery(e.target.value)
            table.setPageIndex(0)
          }}
          placeholder="Search by product title…"
          type="text"
          value={query}
        />
        <div className="text-base-content/60 flex items-center gap-3 text-sm">
          <span>
            {totalFiltered} product{totalFiltered === 1 ? '' : 's'}
          </span>
          <button
            className="pmc-btn pmc-btn-primary pmc-btn-sm gap-1.5"
            disabled={dirtyCount === 0 || saving}
            onClick={saveAll}
            type="button"
          >
            {saving ? <span className="pmc-loading pmc-loading-spinner pmc-loading-xs" /> : <SaveIcon className="size-3.5" />}
            {saving ? 'Saving…' : `Save Changes${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
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
            {rows.map((row) => (
              <tr className={edits[row.original.id] ? 'bg-warning/10' : undefined} key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalFiltered === 0 && <p className="text-base-content/60 text-sm">No products match &quot;{query}&quot;.</p>}

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
