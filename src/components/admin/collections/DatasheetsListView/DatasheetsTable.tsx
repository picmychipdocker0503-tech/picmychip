'use client'

import type { Datasheet } from '@/payload-types'

import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import { FileTextIcon, PlusIcon } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<Datasheet>()

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const columns = [
  createSelectionColumn<Datasheet>(),
  columnHelper.accessor('title', {
    cell: (info) => {
      const doc = info.row.original
      return (
        <a
          className="pmc-link pmc-link-hover flex items-center gap-2"
          href={`/admin/collections/datasheets/${doc.id}`}
        >
          <FileTextIcon className="text-base-content/40 size-4 shrink-0" />
          {info.getValue() || doc.filename || 'Untitled'}
        </a>
      )
    },
    header: 'Title',
  }),
  columnHelper.accessor('filename', {
    cell: (info) => <span className="text-base-content/60 font-mono text-xs">{info.getValue() || '—'}</span>,
    enableSorting: false,
    header: 'Filename',
  }),
  columnHelper.accessor('mimeType', {
    cell: (info) => <span className="text-base-content/60 text-xs">{info.getValue() || '—'}</span>,
    header: 'Type',
  }),
  columnHelper.accessor('filesize', {
    cell: (info) => <span className="text-base-content/60">{formatFileSize(info.getValue())}</span>,
    header: 'Size',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Uploaded',
  }),
]

export const DatasheetsTable: React.FC<{ initialData: ListApiResponse<Datasheet> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) =>
      search ? { or: [{ title: { contains: search } }, { filename: { contains: search } }] } : undefined,
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Datasheet>({
    buildWhere,
    collection: 'datasheets',
    columns: useMemo(() => columns, []),
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No datasheets match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by title or filename…"
      table={table}
      toolbarRight={
        <div className="flex items-center gap-3">
          <BulkActionsBar collection="datasheets" onDeleted={refetch} table={table} />
          <a className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full" href="/admin/collections/datasheets/create">
            <PlusIcon className="size-4" />
            Create New
          </a>
        </div>
      }
      totalDocs={data.totalDocs}
    />
  )
}
