'use client'

import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import { useFeatureFlags } from '@/lib/useFeatureFlags'
import { useCompare } from '@/providers/Compare'

export const CompareBar: React.FC = () => {
  const { ids, clear } = useCompare()
  const flags = useFeatureFlags()

  // Still checked even with the flag off — a shopper who added items before
  // the flag was toggled off shouldn't keep seeing this bar.
  if (!flags.productCompare || ids.length === 0) return null

  return (
    <div className="bg-card fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 border-t md:bottom-0">
      <div className="container flex items-center justify-between gap-4 py-3">
        <span className="text-sm">
          {ids.length} product{ids.length > 1 ? 's' : ''} selected to compare
        </span>
        <div className="flex items-center gap-2">
          <Button onClick={clear} size="sm" variant="ghost">
            Clear
          </Button>
          <Button asChild size="sm">
            <Link href={`/compare?ids=${ids.join(',')}`}>Compare</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
