'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

const STORAGE_KEY = 'compare-products'
const MAX_COMPARE = 4

type CompareContextValue = {
  ids: string[]
  maxCompare: number
  toggle: (id: string) => void
  clear: () => void
  isComparing: (id: string) => boolean
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined)

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setIds(JSON.parse(stored))
    } catch {
      // localStorage unavailable (e.g. private browsing) — compare list just won't persist.
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
      if (prev.includes(id)) return prev.filter((existing) => existing !== id)
      if (prev.length >= MAX_COMPARE) {
        toast.error(`You can compare up to ${MAX_COMPARE} products at a time.`)
        return prev
      }
      return [...prev, id]
    })
  }, [])

  const clear = useCallback(() => setIds([]), [])
  const isComparing = useCallback((id: string) => ids.includes(id), [ids])

  return (
    <CompareContext.Provider value={{ ids, maxCompare: MAX_COMPARE, toggle, clear, isComparing }}>
      {children}
    </CompareContext.Provider>
  )
}

export const useCompare = (): CompareContextValue => {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider')
  return ctx
}
