'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

const STORAGE_KEY = 'wishlist-products'

type WishlistContextValue = {
  ids: string[]
  toggle: (id: string) => void
  isSaved: (id: string) => boolean
  clear: () => void
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setIds(JSON.parse(stored))
    } catch {
      // localStorage unavailable (e.g. private browsing) — wishlist just won't persist.
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // ignore
    }
  }, [ids])

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) {
        toast.success('Removed from favorites.')
        return prev.filter((existing) => existing !== id)
      }
      toast.success('Added to favorites.')
      return [...prev, id]
    })
  }, [])

  const isSaved = useCallback((id: string) => ids.includes(id), [ids])

  const clear = useCallback(() => {
    setIds([])
    toast.success('Wishlist cleared.')
  }, [])

  return <WishlistContext.Provider value={{ ids, toggle, isSaved, clear }}>{children}</WishlistContext.Provider>
}

export const useWishlist = (): WishlistContextValue => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}
