'use client'

import type { InventoryReport } from '@/lib/reports'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from 'lucide-react'
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
    <div className="border-base-content/10 pmc-rounded-box overflow-x-auto border">
      <table className="pmc-table pmc-table-zebra">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr className="text-base-content/70" key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDirection = header.column.getIsSorted()

                return (
                  <th key={header.id}>
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
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
