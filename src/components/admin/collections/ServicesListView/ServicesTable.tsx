'use client'

import type { Service } from '@/payload-types'

import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<Service>()

const columns = [
  createSelectionColumn<Service>(),
  columnHelper.display({
    cell: (info) => {
      const icon = info.row.original.icon
      const iconDoc = typeof icon === 'object' ? icon : undefined
      return (
        <span className="bg-base-200 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {iconDoc?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-contain p-1.5" src={iconDoc.url} />
          ) : (
            <span className="text-base-content/30 text-xs">—</span>
          )}
        </span>
      )
    },
    enableSorting: false,
    header: '',
    id: 'icon',
  }),
  columnHelper.accessor('title', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/services/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Title',
  }),
  columnHelper.accessor('slug', {
    cell: (info) => <span className="text-base-content/60 font-mono">{info.getValue()}</span>,
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

export const ServicesTable: React.FC<{ initialData: ListApiResponse<Service> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) => (search ? { title: { contains: search } } : undefined),
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Service>({
    buildWhere,
    collection: 'services',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No services match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by title…"
      table={table}
      toolbarRight={
        <div className="flex items-center gap-3">
          <BulkActionsBar collection="services" onDeleted={refetch} table={table} />
          <a className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full" href="/admin/collections/services/create">
            <PlusIcon className="size-4" />
            Create New
          </a>
        </div>
      }
      totalDocs={data.totalDocs}
    />
  )
}
