'use client'

import type { RfqSubmission } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const STATUS_TONE: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  new: 'info',
  reviewing: 'warning',
  quoted: 'info',
  won: 'success',
  lost: 'error',
  closed: 'neutral',
}

const columnHelper = createColumnHelper<RfqSubmission>()

const columns = [
  createSelectionColumn<RfqSubmission>(),
  columnHelper.accessor('ticketId', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover font-mono" href={`/admin/collections/rfq-submissions/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Ticket',
  }),
  columnHelper.accessor('status', {
    cell: (info) => {
      const value = info.getValue() || 'new'
      return <StatusPill label={value} tone={STATUS_TONE[value] ?? 'neutral'} />
    },
    header: 'Status',
  }),
  columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`.trim(), {
    id: 'name',
    header: 'Name',
  }),
  columnHelper.accessor('company', {
    cell: (info) => <span className="text-base-content/60">{info.getValue() || '—'}</span>,
    header: 'Company',
  }),
  columnHelper.accessor('email', {
    header: 'Email',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Submitted',
  }),
]

export const RfqSubmissionsTable: React.FC<{ initialData: ListApiResponse<RfqSubmission> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) =>
      search ? { or: [{ ticketId: { contains: search } }, { email: { contains: search } }] } : undefined,
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<RfqSubmission>({
    buildWhere,
    collection: 'rfq-submissions',
    columns: useMemo(() => columns, []),
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No RFQ submissions match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by ticket or email…"
      table={table}
      toolbarRight={<BulkActionsBar collection="rfq-submissions" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
