'use client'

import { ChevronDownIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useState } from 'react'

/**
 * The category/price/spec facet cards below this are always visible on
 * desktop (md:+) — `md:contents` here just removes this wrapper's own box
 * so those cards flow straight into the sidebar's flex layout unchanged.
 * On mobile they're collapsed behind a "Filters" toggle instead of stacking
 * open above the product grid by default.
 */
export function MobileFilterDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:contents">
      <button
        aria-expanded={open}
        className="border-border bg-card flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm md:hidden"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontalIcon className="size-4" />
          Filters
        </span>
        <ChevronDownIcon className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`${open ? 'flex' : 'hidden'} flex-col gap-6 md:contents`}>{children}</div>
    </div>
  )
}
