'use client'

import type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table'

import { getClientSideURL } from '@/utilities/getURL'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ListApiResponse, QueryState } from './types'

const DEFAULT_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 300

// Prefixed so these never collide with Payload's own list-view query params
// (`page`/`limit`/`sort`/`where`/`columns`) — kept even though state is no
// longer read back from the URL (see below), since it also protects a plain
// deep-link (`?dtSearch=...`) from ever being misread as Payload's own
// preference keys.
const PARAM = {
  limit: 'dtLimit',
  page: 'dtPage',
  search: 'dtSearch',
  sort: 'dtSort',
} as const

/** Recursively flattens a Payload `where` clause into REST bracket-notation query params. */
export function appendWhereParams(params: URLSearchParams, value: unknown, prefix = 'where'): void {
  if (Array.isArray(value)) {
    // Indexed, not `[]` — for arrays of primitives (e.g. `id: { in: [...] }`)
    // both parse identically, but for arrays of objects (e.g. `or: [{...},
    // {...}]`) an unindexed `[]` on every item is ambiguous to `qs` (the
    // query-string parser powering Payload's REST API): consecutive `[]`
    // occurrences whose nested keys differ get collapsed into a single
    // merged object instead of separate array entries, silently turning an
    // `or` into an implicit `and` across the two conditions.
    value.forEach((item, index) => appendWhereParams(params, item, `${prefix}[${index}]`))
  } else if (value !== null && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, v]) => {
      appendWhereParams(params, v, `${prefix}[${key}]`)
    })
  } else if (value !== undefined) {
    params.append(prefix, String(value))
  }
}

const readQueryFromLocation = (): QueryState => {
  if (typeof window === 'undefined') {
    return { limit: DEFAULT_LIMIT, page: 1, search: '', sort: '' }
  }
  const params = new URLSearchParams(window.location.search)
  return {
    limit: Number(params.get(PARAM.limit) ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT,
    page: Number(params.get(PARAM.page) ?? '1') || 1,
    search: params.get(PARAM.search) ?? '',
    sort: params.get(PARAM.sort) ?? '',
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

/**
 * Drives a manual-pagination TanStack table against a Payload REST endpoint.
 *
 * State lives in React (not read back from `useSearchParams()`): this list
 * view still renders inside Payload's own `ListQueryProvider` (confirmed via
 * `@payloadcms/next`'s `renderListView`, which wraps `list.Component`
 * overrides the same as `DefaultListView`), and `router.replace()` calls
 * from deep inside that tree were observed to silently no-op — the browser
 * URL never actually changed, even 800ms later (verified directly: a raw
 * `history.replaceState()` call sticks immediately in the same tree, so
 * next/navigation's router itself is what's inert here, not something
 * external reverting it). Local state sidesteps that entirely; the URL is
 * still kept in sync via `history.replaceState` (one-way, state -> URL) so
 * deep links and shareable URLs keep working, with a `popstate` listener for
 * back/forward support.
 */
export function useServerTable<T extends { id: number | string }>({
  buildWhere,
  collection,
  columns,
  depth = 0,
  initialData,
  meta,
}: UseServerTableArgs<T>) {
  const [query, setQuery] = useState<QueryState>(() => readQueryFromLocation())
  const { limit, page, search, sort: sortParam } = query

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
  // Tracks the query state synchronously so `updateParams` never needs to run
  // side effects (fetch, history mutation) from inside a `setState` updater
  // function — React may invoke those more than once (e.g. Strict Mode's
  // dev-only double-invocation), which was firing duplicate, differently-
  // stale fetches and letting the wrong one win the race.
  const queryRef = useRef(query)
  queryRef.current = query
  // Guards against a slower, now-stale fetch response overwriting a faster,
  // newer one when requests are still issued in quick succession.
  const requestIdRef = useRef(0)

  const syncUrl = useCallback((next: QueryState) => {
    const params = new URLSearchParams(window.location.search)

    if (next.page > 1) params.set(PARAM.page, String(next.page))
    else params.delete(PARAM.page)

    if (next.limit !== DEFAULT_LIMIT) params.set(PARAM.limit, String(next.limit))
    else params.delete(PARAM.limit)

    if (next.sort) params.set(PARAM.sort, next.sort)
    else params.delete(PARAM.sort)

    if (next.search) params.set(PARAM.search, next.search)
    else params.delete(PARAM.search)

    const queryString = params.toString()
    window.history.replaceState(null, '', queryString ? `?${queryString}` : window.location.pathname)
  }, [])

  const fetchPage = useCallback(
    async (next: QueryState) => {
      const requestId = ++requestIdRef.current
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', String(next.limit))
        params.set('page', String(next.page))
        params.set('depth', String(depth))
        if (next.sort) params.set('sort', next.sort)

        const where = buildWhere?.(next.search)
        if (where) appendWhereParams(params, where)

        const response = await fetch(`${getClientSideURL()}/api/${collection}?${params.toString()}`, {
          credentials: 'same-origin',
        })
        const json = (await response.json()) as ListApiResponse<T>
        if (requestId !== requestIdRef.current) return // a newer request has since superseded this one
        setData(json)
        setRowSelection({})
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false)
      }
    },
    [buildWhere, collection, depth],
  )

  const updateParams = useCallback(
    (next: Partial<QueryState>) => {
      const merged = { ...queryRef.current, ...next }
      queryRef.current = merged
      setQuery(merged)
      syncUrl(merged)
      fetchPage(merged)
    },
    [fetchPage, syncUrl],
  )

  useEffect(() => {
    const onPopState = () => {
      const next = readQueryFromLocation()
      queryRef.current = next
      setQuery(next)
      setSearchInputState(next.search)
      fetchPage(next)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refetch = useCallback(() => fetchPage(query), [fetchPage, query])

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
