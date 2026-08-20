'use client'

import type { Product } from '@/payload-types'

import { getClientSideURL } from '@/utilities/getURL'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type Ratings = Record<number, { average: number; count: number }>

type ApiResponse = {
  docs: Partial<Product>[]
  ratings: Ratings
  hasNextPage: boolean
  totalDocs: number
}

type StoredState = {
  items: Partial<Product>[]
  ratings: Ratings
  hasNextPage: boolean
  page: number
  scrollY: number
  savedAt: number
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

// Restoring a listing older than this is more likely to show stale stock/price
// data than to be a genuine "click through and come back" flow, so it's
// treated as expired and dropped rather than restored.
const STALE_MS = 30 * 60 * 1000

/**
 * Client-side pagination accumulator for "Load More", with back/forward
 * navigation support: the accumulated pages and scroll position are cached in
 * `sessionStorage` (keyed by the current URL) on unmount, and restored on
 * mount if the user lands back on the same URL — e.g. clicking a product,
 * then hitting the browser back button, without losing the pages they'd
 * already loaded or their scroll position.
 *
 * Intentionally does not sync the accumulated page count into the URL as a
 * query param — a filter/sort change does a full navigation that remounts
 * this hook (via a `key` on the caller), which naturally starts a fresh
 * sessionStorage entry keyed off the new URL, so stale and fresh listings
 * never collide.
 */
export const useLoadMoreProducts = ({
  initialDocs,
  initialRatings,
  initialHasNextPage,
  totalDocs,
  extraParams,
}: UseLoadMoreProductsArgs) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // `page` is hook-internal accumulation state, not part of the listing's
  // identity — excluding it means restoring the URL after a `loadMore` (e.g.
  // via a filter change elsewhere reusing the same path) doesn't collide with
  // an unrelated cached entry left over from before that filter was applied.
  const storageKey = (() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    for (const [key, value] of Object.entries(extraParams ?? {})) params.set(key, value)
    params.sort()
    const qs = params.toString()
    return `loadMore:${pathname}${qs ? `?${qs}` : ''}`
  })()

  const [items, setItems] = useState(initialDocs)
  const [ratings, setRatings] = useState(initialRatings)
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pendingScrollY, setPendingScrollY] = useState<number | null>(null)

  // Mirrors the latest state without forcing the scroll-capture effect below
  // to re-subscribe on every load — read once, at unmount time, via a ref.
  const latestState = useRef({ items, ratings, hasNextPage, page })
  latestState.current = { items, ratings, hasNextPage, page }

  // Restore accumulated pages once per URL. Deliberately runs only when
  // `storageKey` changes (not on every state update) — it's a one-shot
  // hydration from cache, not a live sync.
  useEffect(() => {
    if (typeof window === 'undefined') return

    let raw: string | null = null
    try {
      raw = window.sessionStorage.getItem(storageKey)
    } catch {
      return
    }
    if (!raw) return

    try {
      const saved: StoredState = JSON.parse(raw)
      if (!saved || Date.now() - saved.savedAt > STALE_MS) {
        window.sessionStorage.removeItem(storageKey)
        return
      }
      setItems(saved.items)
      setRatings(saved.ratings)
      setHasNextPage(saved.hasNextPage)
      setPage(saved.page)
      setPendingScrollY(saved.scrollY)
    } catch {
      window.sessionStorage.removeItem(storageKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // Once a restore has set `items` to the full previously-loaded list, the
  // grid has the height it had when the user left — safe to jump to the
  // saved scroll offset. `requestAnimationFrame` gives the browser one paint
  // to lay out the newly-restored items first, avoiding a visible jump.
  useEffect(() => {
    if (pendingScrollY === null) return
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: pendingScrollY, behavior: 'auto' })
      setPendingScrollY(null)
    })
    return () => cancelAnimationFrame(id)
  }, [items, pendingScrollY])

  // Tracks scroll position continuously so the unmount handler below always
  // has an up-to-date value to persist, without re-reading the DOM at a
  // moment that might already be mid-navigation.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const scrollRef = { current: window.scrollY }
    const onScroll = () => {
      scrollRef.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      try {
        const toStore: StoredState = {
          ...latestState.current,
          scrollY: scrollRef.current,
          savedAt: Date.now(),
        }
        window.sessionStorage.setItem(storageKey, JSON.stringify(toStore))
      } catch {
        // Storage full or unavailable (e.g. private browsing) — losing the
        // "load more" cache is a minor UX regression, not worth surfacing.
      }
    }
  }, [storageKey])

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
