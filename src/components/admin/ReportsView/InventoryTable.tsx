'use client'

import type { InventoryReport } from '@/lib/reports'

import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { createColumnHelper, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState } from '@tanstack/react-table'
import React, { useState } from 'react'

type LowStockRow = InventoryReport['lowStock'][number]

const columnHelper = createColumnHelper<LowStockRow>()

const columns = [
  columnHelper.accessor('title', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/products/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Product',
  }),
  columnHelper.accessor('inventory', {
    header: 'Inventory',
  }),
  columnHelper.accessor('lowStockThreshold', {
    cell: (info) => <span className="text-base-content/60">{info.getValue()}</span>,
    header: 'Threshold',
  }),
]

export const InventoryTable: React.FC<{ lowStock: LowStockRow[] }> = ({ lowStock }) => {
  const [sorting, setSorting] = useState<SortingState>([{ desc: false, id: 'inventory' }])

  const table = useReactTable({
    columns,
    data: lowStock,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  return (
    <DataTableShell emptyMessage="No low-stock products right now." table={table} totalDocs={lowStock.length} />
  )
}
