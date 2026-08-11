'use client'

import type { Product } from '@/payload-types'

import React, { createContext, useCallback, useContext, useState } from 'react'

type QuickViewContextValue = {
  product: Product | null
  open: (product: Product) => void
  close: () => void
}

const QuickViewContext = createContext<QuickViewContextValue | undefined>(undefined)

export const QuickViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [product, setProduct] = useState<Product | null>(null)

  const open = useCallback((nextProduct: Product) => setProduct(nextProduct), [])
  const close = useCallback(() => setProduct(null), [])

  return (
    <QuickViewContext.Provider value={{ product, open, close }}>{children}</QuickViewContext.Provider>
  )
}

export const useQuickView = (): QuickViewContextValue => {
  const ctx = useContext(QuickViewContext)
  if (!ctx) throw new Error('useQuickView must be used within a QuickViewProvider')
  return ctx
}
