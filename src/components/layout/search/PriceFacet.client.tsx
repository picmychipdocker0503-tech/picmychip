'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

type Props = {
  min: number
  max: number
}

export const PriceFacetClient: React.FC<Props> = ({ min, max }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [priceMin, setPriceMin] = useState(Number(searchParams.get('priceMin') ?? min))
  const [priceMax, setPriceMax] = useState(Number(searchParams.get('priceMax') ?? max))

  const applyRange = (nextMin: number, nextMax: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (nextMin > min) params.set('priceMin', String(nextMin))
    else params.delete('priceMin')

    if (nextMax < max) params.set('priceMax', String(nextMax))
    else params.delete('priceMax')

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <details className="group" open>
      <summary className="marker:content-none flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        Price
        <svg
          className="size-4 transition-transform group-open:-rotate-180"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>${priceMin}</span>
          <span>${priceMax}</span>
        </div>
        <input
          className="range range-primary range-xs"
          max={max}
          min={min}
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), priceMax)
            setPriceMin(next)
          }}
          onMouseUp={() => applyRange(priceMin, priceMax)}
          onTouchEnd={() => applyRange(priceMin, priceMax)}
          type="range"
          value={priceMin}
        />
        <input
          className="range range-primary range-xs"
          max={max}
          min={min}
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), priceMin)
            setPriceMax(next)
          }}
          onMouseUp={() => applyRange(priceMin, priceMax)}
          onTouchEnd={() => applyRange(priceMin, priceMax)}
          type="range"
          value={priceMax}
        />
      </div>
    </details>
  )
}
