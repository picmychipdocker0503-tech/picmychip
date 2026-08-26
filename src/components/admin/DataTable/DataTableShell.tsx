'use client'

import type { Row, Table } from '@tanstack/react-table'

import { flexRender } from '@tanstack/react-table'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  InboxIcon,
  SearchIcon,
} from 'lucide-react'
import React, { useMemo } from 'react'

type Props<T> = {
  emptyMessage?: string
  isLoading?: boolean
  onSearchChange?: (value: string) => void
  /** Extra classes for a given row — e.g. highlighting one with unsaved edits. */
  rowClassName?: (row: Row<T>) => string | undefined
  searchInput?: string
  searchPlaceholder?: string
  table: Table<T>
  toolbarRight?: React.ReactNode
  totalDocs: number
}

/** Sliding window of page numbers around the current page, e.g. [1, '…', 4, 5, 6, '…', 12]. */
function getPageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const withGaps: (number | '…')[] = []
  sorted.forEach((page, i) => {
    if (i > 0 && page - (sorted[i - 1] as number) > 1) withGaps.push('…')
    withGaps.push(page)
  })
  return withGaps
}

export function DataTableShell<T>({
  emptyMessage = 'No results.',
  isLoading,
  onSearchChange,
  rowClassName,
  searchInput,
  searchPlaceholder = 'Search…',
  table,
  toolbarRight,
  totalDocs,
}: Props<T>) {
  const rows = table.getRowModel().rows
  const columnCount = table.getAllLeafColumns().length
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const currentPage = pageIndex + 1

  const rangeStart = totalDocs === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min(totalDocs, (pageIndex + 1) * pageSize)

  const pageWindow = useMemo(() => getPageWindow(currentPage, pageCount), [currentPage, pageCount])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onSearchChange ? (
          <div className="relative w-full max-w-xs">
            <SearchIcon className="text-base-content/35 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              className="pmc-input pmc-input-sm w-full rounded-full pl-9"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              type="text"
              value={searchInput ?? ''}
            />
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <span className="text-base-content/50 text-sm">
            {totalDocs} result{totalDocs === 1 ? '' : 's'}
          </span>
          {toolbarRight}
        </div>
      </div>

      <div className="border-base-content/8 pmc-rounded-box bg-base-100 relative overflow-hidden border shadow-sm">
        {isLoading && (
          <div className="bg-base-100/70 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <span className="pmc-loading pmc-loading-spinner pmc-loading-sm text-primary" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr className="border-base-content/8 border-b" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortDirection = header.column.getIsSorted()

                    return (
                      <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" key={header.id}>
                        {header.column.getCanSort() ? (
                          <button
                            className={`group flex cursor-pointer items-center gap-1.5 text-xs font-semibold tracking-wide uppercase select-none ${
                              sortDirection ? 'text-primary' : 'text-base-content/45 hover:text-base-content/70'
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span
                              className={`bg-base-content/5 group-hover:bg-primary/10 flex size-4 items-center justify-center rounded-full transition-colors ${
                                sortDirection ? 'bg-primary/12' : ''
                              }`}
                            >
                              {sortDirection === 'desc' ? (
                                <ArrowDownIcon className="size-2.5" />
                              ) : (
                                <ArrowUpIcon
                                  className={`size-2.5 transition-transform ${sortDirection === 'asc' ? '' : '-rotate-90 opacity-40'}`}
                                />
                              )}
                            </span>
                          </button>
                        ) : (
                          <span className="text-base-content/45 text-xs font-semibold tracking-wide uppercase">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-base-content/6 divide-y">
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-16" colSpan={columnCount}>
                    <div className="text-base-content/40 flex flex-col items-center gap-2">
                      <InboxIcon className="size-8 opacity-50" />
                      <span className="text-sm">{emptyMessage}</span>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr
                  className={`transition-colors ${
                    row.getIsSelected() ? 'bg-primary/6' : (rowClassName?.(row) ?? 'hover:bg-base-content/3')
                  }`}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <td
                      className={`px-4 py-3 align-middle ${
                        cellIndex === 0 && row.getIsSelected() ? 'border-primary border-l-2' : ''
                      }`}
                      key={cell.id}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-base-content/50 text-sm">
            Showing <span className="text-base-content/80 font-medium">{rangeStart}</span>–
            <span className="text-base-content/80 font-medium">{rangeEnd}</span> of{' '}
            <span className="text-base-content/80 font-medium">{totalDocs}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              aria-label="First page"
              className="pmc-btn pmc-btn-ghost pmc-btn-sm pmc-btn-square"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
              type="button"
            >
              <ChevronsLeftIcon className="size-4" />
            </button>
            <button
              aria-label="Previous page"
              className="pmc-btn pmc-btn-ghost pmc-btn-sm pmc-btn-square"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              type="button"
            >
              <ChevronLeftIcon className="size-4" />
            </button>

            {pageWindow.map((page, i) =>
              page === '…' ? (
                <span className="text-base-content/30 px-1.5 text-sm" key={`ellipsis-${i}`}>
                  …
                </span>
              ) : (
                <button
                  className={`pmc-btn pmc-btn-sm pmc-btn-square ${
                    page === currentPage ? 'pmc-btn-primary' : 'pmc-btn-ghost'
                  }`}
                  key={page}
                  onClick={() => table.setPageIndex(page - 1)}
                  type="button"
                >
                  {page}
                </button>
              ),
            )}

            <button
              aria-label="Next page"
              className="pmc-btn pmc-btn-ghost pmc-btn-sm pmc-btn-square"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              type="button"
            >
              <ChevronRightIcon className="size-4" />
            </button>
            <button
              aria-label="Last page"
              className="pmc-btn pmc-btn-ghost pmc-btn-sm pmc-btn-square"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(pageCount - 1)}
              type="button"
            >
              <ChevronsRightIcon className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
