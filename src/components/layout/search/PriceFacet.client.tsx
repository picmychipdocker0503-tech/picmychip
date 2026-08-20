'use client'

import { Price } from '@/components/Price'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

type Props = {
  min: number
  max: number
}

const rangeInputClass =
  'pointer-events-none absolute inset-x-0 top-1/2 h-4 w-full -translate-y-1/2 appearance-none bg-transparent ' +
  '[&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent ' +
  '[&::-moz-range-track]:appearance-none [&::-moz-range-track]:bg-transparent ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow'

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

  const span = max - min || 1
  const minPct = ((priceMin - min) / span) * 100
  const maxPct = ((priceMax - min) / span) * 100

  return (
    <details className="group" open>
      <summary className="marker:content-none flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        Filter by price
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
      <div className="mt-4 flex flex-col gap-3">
        <div className="relative h-4 w-full">
          <div className="bg-muted absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full" />
          <div
            className="bg-primary absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
            style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
          />
          <input
            aria-label="Minimum price"
            className={rangeInputClass}
            max={max}
            min={min}
            onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax))}
            onMouseUp={() => applyRange(priceMin, priceMax)}
            onTouchEnd={() => applyRange(priceMin, priceMax)}
            type="range"
            value={priceMin}
          />
          <input
            aria-label="Maximum price"
            className={rangeInputClass}
            max={max}
            min={min}
            onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin))}
            onMouseUp={() => applyRange(priceMin, priceMax)}
            onTouchEnd={() => applyRange(priceMin, priceMax)}
            type="range"
            value={priceMax}
          />
        </div>
        <p className="text-xs">
          <span className="text-foreground font-semibold">Price: </span>
          <Price amount={priceMin} as="span" className="text-muted-foreground" />
          <span className="text-muted-foreground"> — </span>
          <Price amount={priceMax} as="span" className="text-muted-foreground" />
        </p>
      </div>
    </details>
  )
}
