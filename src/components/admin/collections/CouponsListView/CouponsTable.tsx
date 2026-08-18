'use client'

import type { Coupon } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createColumnHelper } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

const columnHelper = createColumnHelper<Coupon>()

const couponStatus = (coupon: Coupon): { label: string; tone: 'success' | 'warning' | 'error' } => {
  const isExpired = Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now())
  if (isExpired) return { label: 'Expired', tone: 'error' }
  if (!coupon.active) return { label: 'Disabled', tone: 'warning' }
  return { label: 'Active', tone: 'success' }
}

const columns = [
  createSelectionColumn<Coupon>(),
  columnHelper.accessor('code', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover font-mono" href={`/admin/collections/coupons/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Code',
  }),
  columnHelper.accessor('type', {
    cell: (info) => <span className="capitalize">{info.getValue()}</span>,
    header: 'Type',
  }),
  columnHelper.accessor('value', {
    cell: (info) => (info.row.original.type === 'percentage' ? `${info.getValue()}%` : info.getValue()),
    header: 'Value',
  }),
  columnHelper.display({
    cell: (info) => {
      const status = couponStatus(info.row.original)
      return <StatusPill label={status.label} tone={status.tone} />
    },
    header: 'Status',
    id: 'status',
  }),
  columnHelper.accessor('redemptionCount', {
    cell: (info) => info.getValue() ?? 0,
    enableSorting: false,
    header: 'Redemptions',
  }),
  columnHelper.accessor('expiresAt', {
    cell: (info) => {
      const value = info.getValue()
      return <span className="text-base-content/60">{value ? formatDateTime({ date: value, format: 'MMM d, yyyy' }) : '—'}</span>
    },
    header: 'Expires',
  }),
  columnHelper.accessor('createdAt', {
    cell: (info) => (
      <span className="text-base-content/60">{formatDateTime({ date: info.getValue(), format: 'MMM d, yyyy' })}</span>
    ),
    header: 'Created',
  }),
]

export const CouponsTable: React.FC<{ initialData: ListApiResponse<Coupon> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) => (search ? { code: { contains: search.toUpperCase() } } : undefined),
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Coupon>({
    buildWhere,
    collection: 'coupons',
    columns: useMemo(() => columns, []),
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No coupons match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by code…"
      table={table}
      toolbarRight={<BulkActionsBar collection="coupons" onDeleted={refetch} table={table} />}
      totalDocs={data.totalDocs}
    />
  )
}
