'use client'

import type { TeamTestimonial } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<TeamTestimonial>()

const columns = [
  createSelectionColumn<TeamTestimonial>(),
  columnHelper.display({
    cell: (info) => {
      const photo = info.row.original.photo
      const photoDoc = typeof photo === 'object' ? photo : undefined
      return (
        <span className="bg-base-200 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {photoDoc?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={photoDoc.url} />
          ) : (
            <span className="text-base-content/30 text-xs">—</span>
          )}
        </span>
      )
    },
    enableSorting: false,
    header: '',
    id: 'photo',
  }),
  columnHelper.accessor('name', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/team-testimonials/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Name',
  }),
  columnHelper.accessor('designation', {
    cell: (info) => <span className="text-base-content/60">{info.getValue() || '—'}</span>,
    header: 'Role',
  }),
  columnHelper.accessor('department', {
    cell: (info) => <span className="text-base-content/60">{info.getValue() || '—'}</span>,
    header: 'Department',
  }),
  columnHelper.accessor('yearsAtCompany', {
    cell: (info) => info.getValue() ?? '—',
    header: 'Years',
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

export const TeamTestimonialsTable: React.FC<{ initialData: ListApiResponse<TeamTestimonial> }> = ({
  initialData,
}) => {
  const buildWhere = useCallback(
    (search: string) => (search ? { name: { contains: search } } : undefined),
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<TeamTestimonial>({
    buildWhere,
    collection: 'team-testimonials',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No team testimonials match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by name…"
      table={table}
      toolbarRight={
        <div className="flex items-center gap-3">
          <BulkActionsBar collection="team-testimonials" onDeleted={refetch} table={table} />
          <a className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full" href="/admin/collections/team-testimonials/create">
            <PlusIcon className="size-4" />
            Create New
          </a>
        </div>
      }
      totalDocs={data.totalDocs}
    />
  )
}
