'use client'

import type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table'

import { getClientSideURL } from '@/utilities/getURL'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ListApiResponse, QueryState } from './types'

const DEFAULT_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 300

/** Recursively flattens a Payload `where` clause into REST bracket-notation query params. */
export function appendWhereParams(params: URLSearchParams, value: unknown, prefix = 'where'): void {
  if (Array.isArray(value)) {
    value.forEach((item) => appendWhereParams(params, item, `${prefix}[]`))
  } else if (value !== null && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, v]) => {
      appendWhereParams(params, v, `${prefix}[${key}]`)
    })
  } else if (value !== undefined) {
    params.append(prefix, String(value))
  }
}

type UseServerTableArgs<T> = {
  buildWhere?: (search: string) => Record<string, unknown> | undefined
  collection: string
  columns: ColumnDef<T, any>[]
  depth?: number
  initialData: ListApiResponse<T>
  meta?: Record<string, unknown>
}

export function useServerTable<T extends { id: number | string }>({
  buildWhere,
  collection,
  columns,
  depth = 0,
  initialData,
  meta,
}: UseServerTableArgs<T>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const limit = Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT
  const sortParam = searchParams.get('sort') ?? ''
  const search = searchParams.get('search') ?? ''

  const sorting = useMemo<SortingState>(() => {
    if (!sortParam) return []
    const desc = sortParam.startsWith('-')
    return [{ desc, id: desc ? sortParam.slice(1) : sortParam }]
  }, [sortParam])

  const [data, setData] = useState<ListApiResponse<T>>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [searchInput, setSearchInputState] = useState(search)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setSearchInputState(search)
  }, [search])

  const updateParams = useCallback(
    (next: Partial<QueryState>) => {
      const params = new URLSearchParams(searchParams.toString())
      const merged = { limit, page, search, sort: sortParam, ...next }

      if (merged.page > 1) params.set('page', String(merged.page))
      else params.delete('page')

      if (merged.limit !== DEFAULT_LIMIT) params.set('limit', String(merged.limit))
      else params.delete('limit')

      if (merged.sort) params.set('sort', merged.sort)
      else params.delete('sort')

      if (merged.search) params.set('search', merged.search)
      else params.delete('search')

      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, page, limit, sortParam, search],
  )

  const fetchPage = useCallback(
    async (query: QueryState) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', String(query.limit))
        params.set('page', String(query.page))
        params.set('depth', String(depth))
        if (query.sort) params.set('sort', query.sort)

        const where = buildWhere?.(query.search)
        if (where) appendWhereParams(params, where)

        const response = await fetch(`${getClientSideURL()}/api/${collection}?${params.toString()}`, {
          credentials: 'same-origin',
        })
        const json = (await response.json()) as ListApiResponse<T>
        setData(json)
        setRowSelection({})
      } finally {
        setIsLoading(false)
      }
    },
    [buildWhere, collection, depth],
  )

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    fetchPage({ limit, page, search, sort: sortParam })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortParam, search])

  const refetch = useCallback(
    () => fetchPage({ limit, page, search, sort: sortParam }),
    [fetchPage, limit, page, search, sortParam],
  )

  const handleSearchInputChange = useCallback(
    (value: string) => {
      setSearchInputState(value)
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = setTimeout(() => {
        updateParams({ page: 1, search: value })
      }, SEARCH_DEBOUNCE_MS)
    },
    [updateParams],
  )

  const table = useReactTable({
    columns,
    data: data.docs,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    meta,
    onPaginationChange: (updater) => {
      const current = { pageIndex: page - 1, pageSize: limit }
      const next = typeof updater === 'function' ? updater(current) : updater
      updateParams({ limit: next.pageSize, page: next.pageIndex + 1 })
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const nextSort = next.length > 0 ? (next[0].desc ? `-${next[0].id}` : next[0].id) : ''
      updateParams({ page: 1, sort: nextSort })
    },
    pageCount: data.totalPages,
    state: {
      pagination: { pageIndex: page - 1, pageSize: limit },
      rowSelection,
      sorting,
    },
  })

  return {
    data,
    isLoading,
    refetch,
    searchInput,
    setSearchInput: handleSearchInputChange,
    table,
  }
}
