'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'recently-viewed-products'
const MAX_ITEMS = 12

type RecentlyViewedContextValue = {
  ids: string[]
  track: (id: string) => void
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | undefined>(undefined)

export const RecentlyViewedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setIds(JSON.parse(stored))
    } catch {
      // localStorage unavailable — recently-viewed just won't persist.
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // ignore
    }
  }, [ids])

  const track = useCallback((id: string) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((existing) => existing !== id)]
      return next.slice(0, MAX_ITEMS)
    })
  }, [])

  return (
    <RecentlyViewedContext.Provider value={{ ids, track }}>{children}</RecentlyViewedContext.Provider>
  )
}

export const useRecentlyViewed = (): RecentlyViewedContextValue => {
  const ctx = useContext(RecentlyViewedContext)
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') return { ids: [], track: () => {} }
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider')
  }
  return ctx
}
