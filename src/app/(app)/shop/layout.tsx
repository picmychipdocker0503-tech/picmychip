import { Categories } from '@/components/layout/search/Categories'
import { PriceFacet } from '@/components/layout/search/PriceFacet'
import { Search } from '@/components/Search'
import { Chip, Connector, ShopBag } from '@/components/illustrations'
import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="container flex flex-col gap-8 my-16 pb-4 ">
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 relative overflow-hidden rounded-2xl border border-border p-8">
          <Chip className="text-primary pointer-events-none absolute -right-6 -bottom-8 hidden size-32 rotate-12 opacity-10 sm:block" />
          <Connector className="text-primary pointer-events-none absolute top-1/2 right-24 hidden size-16 -translate-y-1/2 -rotate-6 opacity-10 lg:block" />

          <div className="relative flex items-center gap-5">
            <div className="border-primary/20 bg-primary/10 text-primary hidden shrink-0 items-center justify-center rounded-2xl border p-4 sm:flex">
              <ShopBag className="size-11" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Shop</h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Browse the full catalog — filter by category and spec to find exactly what you need.
              </p>
            </div>
          </div>
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
