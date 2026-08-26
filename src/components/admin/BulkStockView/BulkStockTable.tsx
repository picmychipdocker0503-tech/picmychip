'use client'

import type { Product } from '@/payload-types'

import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { toast } from '@payloadcms/ui'
import { SaveIcon } from 'lucide-react'
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

  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <div className="border-base-content/10 bg-base-100/40 pmc-rounded-box border p-5 shadow-md backdrop-blur-xl">
      <DataTableShell
        emptyMessage={`No products match "${query}".`}
        onSearchChange={(value) => {
          setQuery(value)
          table.setPageIndex(0)
        }}
        rowClassName={(row) => (edits[row.original.id] ? 'bg-warning/10 hover:bg-warning/15' : undefined)}
        searchInput={query}
        searchPlaceholder="Search by product title…"
        table={table}
        toolbarRight={
          <button
            className="pmc-btn pmc-btn-primary pmc-btn-sm gap-1.5"
            disabled={dirtyCount === 0 || saving}
            onClick={saveAll}
            type="button"
          >
            {saving ? <span className="pmc-loading pmc-loading-spinner pmc-loading-xs" /> : <SaveIcon className="size-3.5" />}
            {saving ? 'Saving…' : `Save Changes${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
          </button>
        }
        totalDocs={totalFiltered}
      />
    </div>
  )
}
