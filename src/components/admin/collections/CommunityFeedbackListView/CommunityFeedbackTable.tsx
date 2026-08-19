'use client'

import type { CommunityFeedback } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<CommunityFeedback>()

const columns = [
  createSelectionColumn<CommunityFeedback>(),
  columnHelper.display({
    cell: (info) => {
      const image = info.row.original.image
      const imageDoc = typeof image === 'object' ? image : undefined
      return (
        <span className="bg-base-200 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {imageDoc?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={imageDoc.url} />
          ) : (
            <span className="text-base-content/30 text-xs">—</span>
          )}
        </span>
      )
    },
    enableSorting: false,
    header: '',
    id: 'image',
  }),
  columnHelper.accessor('name', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/community-feedback/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Name',
  }),
  columnHelper.accessor('designation', {
    cell: (info) => <span className="text-base-content/60">{info.getValue() || '—'}</span>,
    header: 'Designation',
  }),
  columnHelper.accessor('companyName', {
    cell: (info) => <span className="text-base-content/60">{info.getValue() || '—'}</span>,
    header: 'Company',
  }),
  columnHelper.accessor('feedback', {
    cell: (info) => <span className="text-base-content/60 line-clamp-1 max-w-xs">{info.getValue()}</span>,
    enableSorting: false,
    header: 'Feedback',
  }),
  columnHelper.accessor('featured', {
    cell: (info) =>
      info.getValue() ? (
        <StatusPill label="Featured" tone="success" />
      ) : (
        <StatusPill label="Hidden" tone="neutral" />
      ),
    header: 'Featured',
  }),
  columnHelper.accessor('updatedAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Updated',
  }),
]

export const CommunityFeedbackTable: React.FC<{ initialData: ListApiResponse<CommunityFeedback> }> = ({
  initialData,
}) => {
  const buildWhere = useCallback(
    (search: string) =>
      search ? { or: [{ name: { contains: search } }, { companyName: { contains: search } }] } : undefined,
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<CommunityFeedback>({
    buildWhere,
    collection: 'community-feedback',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No community feedback matches your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by name or company…"
      table={table}
      toolbarRight={<BulkActionsBar collection="community-feedback" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
