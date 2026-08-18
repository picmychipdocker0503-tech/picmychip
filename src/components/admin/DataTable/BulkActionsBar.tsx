'use client'

import type { ColumnDef, Table } from '@tanstack/react-table'

import { getClientSideURL } from '@/utilities/getURL'
import { toast } from '@payloadcms/ui'
import { Trash2Icon } from 'lucide-react'
import React, { useState } from 'react'

import { appendWhereParams } from './useServerTable'

export function createSelectionColumn<T>(): ColumnDef<T, unknown> {
  return {
    cell: ({ row }) => (
      <input
        checked={row.getIsSelected()}
        className="pmc-checkbox pmc-checkbox-sm"
        onChange={row.getToggleSelectedHandler()}
        type="checkbox"
      />
    ),
    enableSorting: false,
    header: ({ table }) => (
      <input
        checked={table.getIsAllPageRowsSelected()}
        className="pmc-checkbox pmc-checkbox-sm"
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        type="checkbox"
      />
    ),
    id: 'select',
  }
}

type Props<T> = {
  collection: string
  onDeleted: () => void
  table: Table<T>
}

export function BulkActionsBar<T>({ collection, onDeleted, table }: Props<T>) {
  const [deleting, setDeleting] = useState(false)
  const selectedRows = table.getSelectedRowModel().rows
  const selectedCount = selectedRows.length

  if (selectedCount === 0) return null

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${selectedCount} selected item${selectedCount === 1 ? '' : 's'}? This cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const params = new URLSearchParams()
      appendWhereParams(
        params,
        { id: { in: selectedRows.map((row) => row.original as { id: number | string }).map((doc) => doc.id) } },
      )

      const response = await fetch(`${getClientSideURL()}/api/${collection}?${params.toString()}`, {
        credentials: 'same-origin',
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Request failed')

      toast.success(`Deleted ${selectedCount} item${selectedCount === 1 ? '' : 's'}.`)
      table.resetRowSelection()
      onDeleted()
    } catch {
      toast.error('Failed to delete — please retry.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-base-content/70 text-sm">{selectedCount} selected</span>
      <button
        className="pmc-btn pmc-btn-error pmc-btn-sm gap-1.5"
        disabled={deleting}
        onClick={handleDelete}
        type="button"
      >
        {deleting ? <span className="pmc-loading pmc-loading-spinner pmc-loading-xs" /> : <Trash2Icon className="size-3.5" />}
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}
