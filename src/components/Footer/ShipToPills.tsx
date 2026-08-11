'use client'

import { SHIP_TO_COUNTRY } from '@/lib/shipToCountries'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { cn } from '@/utilities/cn'
import React from 'react'

export const ShipToPills: React.FC = () => {
  const { currency, setCurrency, supportedCurrencies } = useCurrency()

  if (supportedCurrencies.length <= 1) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {supportedCurrencies.map((supported) => {
        const shipTo = SHIP_TO_COUNTRY[supported.code]
        if (!shipTo) return null
        const active = supported.code === currency.code

        return (
          <button
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary/10 text-white'
                : 'border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white',
            )}
            key={supported.code}
            onClick={() => setCurrency(supported.code)}
            type="button"
          >
            <span aria-hidden="true">{shipTo.flag}</span>
            {shipTo.country}
          </button>
        )
      })}
    </div>
  )
}
