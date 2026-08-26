'use client'

import type { FormSubmission } from '@/payload-types'

import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<FormSubmission>()

const columns = [
  createSelectionColumn<FormSubmission>(),
  columnHelper.display({
    cell: (info) => {
      const form = info.row.original.form
      const formDoc = typeof form === 'object' ? form : undefined
      return formDoc ? (
        <a className="pmc-link pmc-link-hover" href={`/admin/collections/forms/${formDoc.id}`}>
          {formDoc.title}
        </a>
      ) : (
        <span className="text-base-content/40">—</span>
      )
    },
    header: 'Form',
    id: 'form',
  }),
  columnHelper.display({
    cell: (info) => {
      const entries = info.row.original.submissionData ?? []
      const preview = entries
        .slice(0, 2)
        .map((entry) => `${entry.field}: ${entry.value}`)
        .join(' · ')
      return <span className="text-base-content/60 line-clamp-1 max-w-sm">{preview || '—'}</span>
    },
    enableSorting: false,
    header: 'Submission',
    id: 'submission',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <a
        className="pmc-link pmc-link-hover text-base-content/60"
        href={`/admin/collections/form-submissions/${info.row.original.id}`}
      >
        {formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy h:mm a' })}
      </a>
    ),
    header: 'Submitted',
  }),
]

export const FormSubmissionsTable: React.FC<{ initialData: ListApiResponse<FormSubmission> }> = ({
  initialData,
}) => {
  const { data, isLoading, refetch, table } = useServerTable<FormSubmission>({
    collection: 'form-submissions',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No form submissions yet."
      isLoading={isLoading}
      table={table}
      toolbarRight={<BulkActionsBar collection="form-submissions" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
