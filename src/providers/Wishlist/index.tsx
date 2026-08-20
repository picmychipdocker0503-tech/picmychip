'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/providers/Auth'
import { clearWishlist, getWishlistProductIds, mergeLocalWishlistIntoServer, toggleWishlistItem } from './actions'

const STORAGE_KEY = 'wishlist-products'

type WishlistContextValue = {
  ids: string[]
  toggle: (id: string) => void
  isSaved: (id: string) => boolean
  clear: () => void
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

const readLocal = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const writeLocal = (ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage unavailable (e.g. private browsing) — wishlist just won't persist.
  }
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [ids, setIds] = useState<string[]>([])
  const hasMergedRef = useRef(false)

  // Guests: hydrate from localStorage. Re-runs on logout too, so a signed-out
  // browser reverts to whatever local wishlist it had before signing in.
  useEffect(() => {
    if (!user) setIds(readLocal())
  }, [user])

  // Signed-in: merge any local (guest) items into the server wishlist once
  // per session, then the server is the source of truth from here on.
  useEffect(() => {
    if (!user || hasMergedRef.current) return
    hasMergedRef.current = true

    const localIds = readLocal()

    ;(localIds.length > 0 ? mergeLocalWishlistIntoServer(localIds) : getWishlistProductIds())
      .then((serverIds) => {
        setIds(serverIds)
        writeLocal([])
      })
      .catch(() => {})
  }, [user])

  // Persist guest state to localStorage as it changes. No-op once signed in
  // (server actions below are the source of truth then).
  useEffect(() => {
    if (!user) writeLocal(ids)
  }, [ids, user])

  const toggle = useCallback(
    (id: string) => {
      const wasSaved = ids.includes(id)

      // Optimistic — the server round-trip (when signed in) shouldn't block
      // the heart icon from flipping instantly.
      setIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
      toast.success(wasSaved ? 'Removed from favorites.' : 'Added to favorites.')

      if (user) {
        toggleWishlistItem(id).catch(() => {
          setIds((prev) => (wasSaved ? [...prev, id] : prev.filter((existing) => existing !== id)))
          toast.error('Could not update your wishlist — please retry.')
        })
      }
    },
    [ids, user],
  )

  const isSaved = useCallback((id: string) => ids.includes(id), [ids])

  const clear = useCallback(() => {
    setIds([])
    toast.success('Wishlist cleared.')
    if (user) {
      clearWishlist().catch(() => {
        toast.error('Could not clear your wishlist — please retry.')
      })
    }
  }, [user])

  return <WishlistContext.Provider value={{ ids, toggle, isSaved, clear }}>{children}</WishlistContext.Provider>
}

export const useWishlist = (): WishlistContextValue => {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        ids: [],
        toggle: () => {},
        isSaved: () => false,
        clear: () => {},
      }
    }
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return ctx
}
