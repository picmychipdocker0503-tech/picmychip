'use client'

import type { Product } from '@/payload-types'

import { getClientSideURL } from '@/utilities/getURL'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Ratings = Record<number, { average: number; count: number }>

type ApiResponse = {
  docs: Partial<Product>[]
  ratings: Ratings
  hasNextPage: boolean
  totalDocs: number
}

type UseLoadMoreProductsArgs = {
  initialDocs: Partial<Product>[]
  initialRatings: Ratings
  initialHasNextPage: boolean
  totalDocs: number
  /** Extra query params merged into the fetch — e.g. `{ category: id }` for
   * category pages, where the category isn't a URL search param. */
  extraParams?: Record<string, string>
}

/**
 * Client-side pagination accumulator for "Load More". Intentionally does not
 * sync the accumulated page count back into the URL — the first page always
 * comes from the server component's own searchParams-driven fetch, and any
 * filter/sort change does a full navigation that remounts the component
 * (via a `key` on the caller) rather than fighting this hook's own state.
 */
export const useLoadMoreProducts = ({
  initialDocs,
  initialRatings,
  initialHasNextPage,
  totalDocs,
  extraParams,
}: UseLoadMoreProductsArgs) => {
  const searchParams = useSearchParams()
  const [items, setItems] = useState(initialDocs)
  const [ratings, setRatings] = useState(initialRatings)
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)

  const loadMore = async () => {
    if (isLoading || !hasNextPage) return
    setIsLoading(true)

    const nextPage = page + 1
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(extraParams ?? {})) params.set(key, value)
    params.set('page', String(nextPage))

    try {
      const res = await fetch(`${getClientSideURL()}/api/products?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load more products')
      const data: ApiResponse = await res.json()

      setItems((prev) => [...prev, ...data.docs])
      setRatings((prev) => ({ ...prev, ...data.ratings }))
      setHasNextPage(data.hasNextPage)
      setPage(nextPage)
    } catch {
      // Leave hasNextPage as-is so the button stays visible and retryable.
    } finally {
      setIsLoading(false)
    }
  }

  return { items, ratings, hasNextPage, isLoading, loadMore, totalDocs }
}
