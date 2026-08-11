'use client'

import type { FacetDef } from '@/lib/facetConfig'
import { facetKey } from '@/lib/facetParams'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type Props = {
  facet: FacetDef
  distribution?: Record<string, number>
}

export const SelectFacet: React.FC<Props> = ({ facet, distribution }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const key = facetKey(facet.attribute)
  const activeValues = (searchParams.get(key) ?? '').split(',').filter(Boolean)
  const options = Object.entries(distribution ?? {})

  if (options.length === 0) return null

  const toggle = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    const next = activeValues.includes(value)
      ? activeValues.filter((v) => v !== value)
      : [...activeValues, value]

    if (next.length > 0) params.set(key, next.join(','))
    else params.delete(key)

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground">{facet.label}</Label>
      <div className="flex flex-col gap-1.5">
        {options.map(([value, count]) => (
          <label className="flex items-center gap-2 text-sm" key={value}>
            <Checkbox checked={activeValues.includes(value)} onCheckedChange={() => toggle(value)} />
            <span>{value}</span>
            <span className="text-muted-foreground">({count})</span>
          </label>
        ))}
      </div>
    </div>
  )
}
