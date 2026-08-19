'use client'

import type { Brand } from '@/payload-types'

import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<Brand>()

const columns = [
  createSelectionColumn<Brand>(),
  columnHelper.display({
    cell: (info) => {
      const brand = info.row.original
      const logo = typeof brand.logo === 'object' ? brand.logo : undefined
      return (
        <span className="bg-base-200 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {logo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-contain" src={logo.url} />
          ) : (
            <span className="text-base-content/30 text-xs">—</span>
          )}
        </span>
      )
    },
    enableSorting: false,
    header: '',
    id: 'logo',
  }),
  columnHelper.accessor('title', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/brands/${info.row.original.id}`}>
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
  columnHelper.accessor('description', {
    cell: (info) => <span className="text-base-content/60 line-clamp-1 max-w-xs">{info.getValue() || '—'}</span>,
    enableSorting: false,
    header: 'Description',
  }),
  columnHelper.accessor('updatedAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Updated',
  }),
]

export const BrandsTable: React.FC<{ initialData: ListApiResponse<Brand> }> = ({ initialData }) => {
  const buildWhere = useCallback((search: string) => (search ? { title: { contains: search } } : undefined), [])

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Brand>({
    buildWhere,
    collection: 'brands',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No brands match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by title…"
      table={table}
      toolbarRight={<BulkActionsBar collection="brands" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
