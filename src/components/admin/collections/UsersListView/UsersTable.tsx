'use client'

import type { User } from '@/payload-types'

import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<User>()

const columns = [
  createSelectionColumn<User>(),
  columnHelper.display({
    cell: (info) => {
      const avatar = info.row.original.avatar
      const avatarDoc = typeof avatar === 'object' ? avatar : undefined
      return (
        <span className="bg-base-200 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {avatarDoc?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={avatarDoc.url} />
          ) : (
            <span className="text-base-content/40 text-xs font-semibold uppercase">
              {(info.row.original.name || info.row.original.email || '?').charAt(0)}
            </span>
          )}
        </span>
      )
    },
    enableSorting: false,
    header: '',
    id: 'avatar',
  }),
  columnHelper.accessor('name', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/users/${info.row.original.id}`}>
        {info.getValue() || '—'}
      </a>
    ),
    header: 'Name',
  }),
  columnHelper.accessor('email', {
    header: 'Email',
  }),
  columnHelper.accessor((row) => row.roles?.join(', ') ?? '', {
    id: 'roles',
    cell: (info) => <span className="capitalize">{info.getValue() || '—'}</span>,
    enableSorting: false,
    header: 'Roles',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Joined',
  }),
]

export const UsersTable: React.FC<{ initialData: ListApiResponse<User> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) =>
      search ? { or: [{ name: { contains: search } }, { email: { contains: search } }] } : undefined,
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<User>({
    buildWhere,
    collection: 'users',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No users match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by name or email…"
      table={table}
      toolbarRight={
        <div className="flex items-center gap-3">
          <BulkActionsBar collection="users" onDeleted={refetch} table={table} />
          <a className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full" href="/admin/collections/users/create">
            Create New
          </a>
        </div>
      }
      totalDocs={data.totalDocs}
    />
  )
}
