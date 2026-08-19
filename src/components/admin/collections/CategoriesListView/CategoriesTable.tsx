'use client'

import type { Category } from '@/payload-types'

import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { SPEC_SCHEMA_OPTIONS } from '@/fields/productSpecs/specSchemaOptions'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<Category>()

const SPEC_SCHEMA_LABELS: Record<string, string> = Object.fromEntries(
  SPEC_SCHEMA_OPTIONS.map((option) => [option.value, option.label]),
)

const columns = [
  createSelectionColumn<Category>(),
  columnHelper.accessor('title', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/categories/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Title',
  }),
  columnHelper.display({
    cell: (info) => {
      const parent = info.row.original.parent
      const parentDoc = typeof parent === 'object' ? parent : undefined
      return parentDoc ? (
        <a className="pmc-link pmc-link-hover" href={`/admin/collections/categories/${parentDoc.id}`}>
          {parentDoc.title}
        </a>
      ) : (
        <span className="text-base-content/40">—</span>
      )
    },
    enableSorting: false,
    header: 'Parent',
    id: 'parent',
  }),
  columnHelper.accessor('specSchemaType', {
    cell: (info) => {
      const value = info.getValue()
      return <span>{value ? (SPEC_SCHEMA_LABELS[value] ?? value) : '—'}</span>
    },
    header: 'Spec Schema',
  }),
  columnHelper.accessor('slug', {
    cell: (info) => <span className="text-base-content/60 font-mono text-xs">{info.getValue()}</span>,
    enableSorting: false,
    header: 'Slug',
  }),
  columnHelper.accessor('updatedAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Updated',
  }),
]

export const CategoriesTable: React.FC<{ initialData: ListApiResponse<Category> }> = ({ initialData }) => {
  const buildWhere = useCallback((search: string) => (search ? { title: { contains: search } } : undefined), [])

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Category>({
    buildWhere,
    collection: 'categories',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No categories match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by title…"
      table={table}
      toolbarRight={<BulkActionsBar collection="categories" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
