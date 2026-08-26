'use client'

import type { Guide } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<Guide>()

const columns = [
  createSelectionColumn<Guide>(),
  columnHelper.display({
    cell: (info) => {
      const cover = info.row.original.coverImage
      const coverDoc = typeof cover === 'object' ? cover : undefined
      return (
        <span className="bg-base-200 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {coverDoc?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={coverDoc.url} />
          ) : (
            <span className="text-base-content/30 text-xs">—</span>
          )}
        </span>
      )
    },
    enableSorting: false,
    header: '',
    id: 'coverImage',
  }),
  columnHelper.accessor('title', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/guides/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Title',
  }),
  columnHelper.accessor('contentType', {
    cell: (info) => <span className="text-base-content/60 capitalize">{info.getValue() || 'article'}</span>,
    header: 'Type',
  }),
  columnHelper.accessor('authorName', {
    cell: (info) => <span className="text-base-content/60">{info.getValue() || '—'}</span>,
    header: 'Author',
  }),
  columnHelper.accessor('_status', {
    cell: (info) =>
      info.getValue() === 'published' ? (
        <StatusPill label="Published" tone="success" />
      ) : (
        <StatusPill label="Draft" tone="warning" />
      ),
    header: 'Status',
  }),
  columnHelper.accessor('updatedAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Updated',
  }),
]

export const GuidesTable: React.FC<{ initialData: ListApiResponse<Guide> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) => (search ? { title: { contains: search } } : undefined),
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Guide>({
    buildWhere,
    collection: 'guides',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No guides match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by title…"
      table={table}
      toolbarRight={
        <div className="flex items-center gap-3">
          <BulkActionsBar collection="guides" onDeleted={refetch} table={table} />
          <a className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full" href="/admin/collections/guides/create">
            <PlusIcon className="size-4" />
            Create New
          </a>
        </div>
      }
      totalDocs={data.totalDocs}
    />
  )
}
