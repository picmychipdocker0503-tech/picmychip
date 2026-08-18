'use client'

import type { Table } from '@tanstack/react-table'

import { flexRender } from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import React from 'react'

type Props<T> = {
  emptyMessage?: string
  isLoading?: boolean
  onSearchChange?: (value: string) => void
  searchInput?: string
  searchPlaceholder?: string
  table: Table<T>
  toolbarRight?: React.ReactNode
  totalDocs: number
}

export function DataTableShell<T>({
  emptyMessage = 'No results.',
  isLoading,
  onSearchChange,
  searchInput,
  searchPlaceholder = 'Search…',
  table,
  toolbarRight,
  totalDocs,
}: Props<T>) {
  const rows = table.getRowModel().rows
  const columnCount = table.getAllLeafColumns().length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onSearchChange ? (
          <input
            className="pmc-input pmc-input-sm w-full max-w-xs"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            type="text"
            value={searchInput ?? ''}
          />
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <span className="text-base-content/60 text-sm">
            {totalDocs} result{totalDocs === 1 ? '' : 's'}
          </span>
          {toolbarRight}
        </div>
      </div>

      <div className="border-base-content/10 pmc-rounded-box relative overflow-x-auto border">
        {isLoading && (
          <div className="bg-base-100/60 absolute inset-0 z-10 flex items-center justify-center">
            <span className="pmc-loading pmc-loading-spinner pmc-loading-sm" />
          </div>
        )}
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
                <td className="text-base-content/50" colSpan={columnCount}>
                  {emptyMessage}
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
