'use client'

import type { FacetDef } from '@/lib/facetConfig'
import { facetKey } from '@/lib/facetParams'
import { XIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

type Props = {
  facets: FacetDef[]
}

type Pill = { key: string; label: string; onRemove: () => void }

export const ActiveFiltersBar: React.FC<Props> = ({ facets }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigate = (params: URLSearchParams) => {
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const pills: Pill[] = []

  for (const facet of facets) {
    const key = facetKey(facet.attribute)

    if (facet.type === 'range') {
      const min = searchParams.get(`${key}_min`)
      const max = searchParams.get(`${key}_max`)

      if (min || max) {
        pills.push({
          key: `${key}-range`,
          label: `${facet.label}: ${min ?? '…'}–${max ?? '…'}`,
          onRemove: () => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete(`${key}_min`)
            params.delete(`${key}_max`)
            navigate(params)
          },
        })
      }
    } else {
      const values = (searchParams.get(key) ?? '').split(',').filter(Boolean)

      for (const value of values) {
        pills.push({
          key: `${key}-${value}`,
          label: `${facet.label}: ${value}`,
          onRemove: () => {
            const params = new URLSearchParams(searchParams.toString())
            const next = values.filter((v) => v !== value)
            if (next.length > 0) params.set(key, next.join(','))
            else params.delete(key)
            navigate(params)
          },
        })
      }
    }
  }

  if (pills.length === 0) return null

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    for (const facet of facets) {
      const key = facetKey(facet.attribute)
      params.delete(key)
      params.delete(`${key}_min`)
      params.delete(`${key}_max`)
    }
    navigate(params)
  }

  return (
    <div className="bg-background/95 sticky top-0 z-10 mb-6 flex flex-wrap items-center gap-2 border-b py-3 backdrop-blur">
      <span className="text-muted-foreground text-xs">Filters:</span>
      {pills.map((pill) => (
        <button
          className="border-border bg-card hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors"
          key={pill.key}
          onClick={pill.onRemove}
          type="button"
        >
          {pill.label}
          <XIcon className="size-3" />
        </button>
      ))}
      <button
        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
        onClick={clearAll}
        type="button"
      >
        Clear all
      </button>
    </div>
  )
}
