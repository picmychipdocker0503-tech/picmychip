'use client'

import type { Category, Product } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { BulkActionsBar, createSelectionColumn } from '@/components/admin/DataTable/BulkActionsBar'
import { DataTableShell } from '@/components/admin/DataTable/DataTableShell'
import { useServerTable } from '@/components/admin/DataTable/useServerTable'
import { createColumnHelper } from '@tanstack/react-table'
import { DownloadIcon, PlusIcon } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

import type { ListApiResponse } from '../../DataTable/types'

// Product.priceInINR is stored in paise, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

const STOCK_TONE: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  'in-stock': 'success',
  'low-stock': 'warning',
  'out-of-stock': 'error',
  backorder: 'info',
}

const columnHelper = createColumnHelper<Product>()

const columns = [
  createSelectionColumn<Product>(),
  columnHelper.display({
    cell: (info) => {
      const image = info.row.original.gallery?.[0]?.image
      const imageDoc = typeof image === 'object' ? image : undefined
      return (
        <span className="bg-base-200 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {imageDoc?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-contain p-1" src={imageDoc.url} />
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
  columnHelper.accessor('title', {
    cell: (info) => (
      <a className="pmc-link pmc-link-hover" href={`/admin/collections/products/${info.row.original.id}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Title',
  }),
  columnHelper.display({
    cell: (info) => {
      const brand = info.row.original.brand
      const brandDoc = typeof brand === 'object' ? brand : undefined
      return <span className="text-base-content/60">{brandDoc?.title || '—'}</span>
    },
    header: 'Brand',
    id: 'brand',
  }),
  columnHelper.display({
    cell: (info) => {
      const categories = info.row.original.categories
      const names = Array.isArray(categories)
        ? categories.map((c) => (typeof c === 'object' ? (c as Category).title : undefined)).filter(Boolean)
        : []
      return <span className="text-base-content/60 line-clamp-1 max-w-40">{names.length ? names.join(', ') : '—'}</span>
    },
    enableSorting: false,
    header: 'Categories',
    id: 'categories',
  }),
  columnHelper.accessor('priceInINR', {
    cell: (info) => (typeof info.getValue() === 'number' ? formatCurrency(info.getValue()!) : '—'),
    header: 'Price',
  }),
  columnHelper.accessor('stockStatus', {
    cell: (info) => {
      const value = info.getValue() || 'in-stock'
      return <StatusPill label={value.replace('-', ' ')} tone={STOCK_TONE[value] ?? 'neutral'} />
    },
    header: 'Stock',
  }),
  columnHelper.accessor('_status', {
    cell: (info) =>
      info.getValue() === 'published' ? (
        <StatusPill label="Published" tone="success" />
      ) : (
        <StatusPill label="Draft" tone="warning" />
      ),
    header: 'Status',
  }),
]

export const ProductsTable: React.FC<{ initialData: ListApiResponse<Product> }> = ({ initialData }) => {
  const buildWhere = useCallback(
    (search: string) =>
      search ? { or: [{ title: { contains: search } }, { sku: { contains: search } }] } : undefined,
    [],
  )

  const { data, isLoading, refetch, searchInput, setSearchInput, table } = useServerTable<Product>({
    buildWhere,
    collection: 'products',
    columns: useMemo(() => columns, []),
    depth: 1,
    initialData,
  })

  return (
    <DataTableShell
      emptyMessage="No products match your search."
      isLoading={isLoading}
      onSearchChange={setSearchInput}
      searchInput={searchInput}
      searchPlaceholder="Search by title or SKU…"
      table={table}
      toolbarRight={
        <div className="flex items-center gap-3">
          <BulkActionsBar collection="products" onDeleted={refetch} table={table} />
          <a className="pmc-btn pmc-btn-outline pmc-btn-sm rounded-full" href="/api/admin/bulk-products/export">
            <DownloadIcon className="size-4" />
            Export to Excel
          </a>
          <a className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full" href="/admin/collections/products/create">
            <PlusIcon className="size-4" />
            Create New
          </a>
        </div>
      }
      totalDocs={data.totalDocs}
    />
  )
}
