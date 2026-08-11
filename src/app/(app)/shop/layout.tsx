import { Categories } from '@/components/layout/search/Categories'
import { PriceFacet } from '@/components/layout/search/PriceFacet'
import { Search } from '@/components/Search'
import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="container flex flex-col gap-8 my-16 pb-4 ">
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 border border-border">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Shop</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Browse the full catalog — filter by category and spec to find exactly what you need.
          </p>
        </div>

        <div className="relative">
          <Search className="mb-8" />
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-8 md:gap-8">
          <div className="w-full flex-none flex flex-col gap-6 md:gap-8 basis-1/5 md:sticky md:top-24">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <Categories />
            </div>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <Suspense fallback={null}>
                <PriceFacet />
              </Suspense>
            </div>
          </div>
          <div className="min-h-screen w-full flex-1">{children}</div>
        </div>
      </div>
    </Suspense>
  )
}
