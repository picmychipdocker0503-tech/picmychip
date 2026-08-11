'use client'

import type { FacetDef } from '@/lib/facetConfig'
import { facetKey } from '@/lib/facetParams'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  facet: FacetDef
}

export const RangeFacet: React.FC<Props> = ({ facet }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const key = facetKey(facet.attribute)
  const [min, setMin] = useState(searchParams.get(`${key}_min`) ?? '')
  const [max, setMax] = useState(searchParams.get(`${key}_max`) ?? '')

  const applyRange = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (min) params.set(`${key}_min`, min)
    else params.delete(`${key}_min`)

    if (max) params.set(`${key}_max`, max)
    else params.delete(`${key}_max`)

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground">{facet.label}</Label>
      <div className="flex items-center gap-2">
        <Input
          className="h-8 w-20"
          onBlur={applyRange}
          onChange={(e) => setMin(e.target.value)}
          placeholder="Min"
          type="number"
          value={min}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          className="h-8 w-20"
          onBlur={applyRange}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Max"
          type="number"
          value={max}
        />
      </div>
    </div>
  )
}
