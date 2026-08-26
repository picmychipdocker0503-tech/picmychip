'use client'

import type { EmailEvent } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const STATUS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  sent: 'success',
  failed: 'error',
  unknown: 'warning',
}

const columnHelper = createColumnHelper<EmailEvent>()

const columns = [
  createSelectionColumn<EmailEvent>(),
  columnHelper.accessor('emailEventId', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover font-mono" href={`/admin/collections/email-events/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Event',
  }),
  columnHelper.accessor('emailType', {
    header: 'Type',
  }),
  columnHelper.accessor('recipient', {
    header: 'Recipient',
  }),
  columnHelper.accessor('status', {
    cell: (info) => {
      const value = info.getValue()
      return <StatusPill label={value} tone={STATUS_TONE[value] ?? 'neutral'} />
    },
    header: 'Status',
  }),
  columnHelper.accessor('primaryProvider', {
    cell: (info) => <span className="text-base-content/60">{info.getValue() || '—'}</span>,
    header: 'Primary provider',
  }),
  columnHelper.accessor('fallbackProvider', {
    cell: (info) => <span className="text-base-content/60">{info.getValue() || '—'}</span>,
    header: 'Fallback provider',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, h:mm a' })}</span>
    ),
    header: 'Sent',
  }),
]

export const EmailEventsTable: React.FC<{ initialData: ListApiResponse<EmailEvent> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) =>
      search ? { or: [{ recipient: { contains: search } }, { emailEventId: { contains: search } }] } : undefined,
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<EmailEvent>({
    buildWhere,
    collection: 'email-events',
    columns: useMemo(() => columns, []),
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No email events match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by recipient or event id…"
      table={table}
      toolbarRight={<BulkActionsBar collection="email-events" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
