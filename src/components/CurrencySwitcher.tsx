'use client'

import { SHIP_TO_COUNTRY } from '@/lib/shipToCountries'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

export const CurrencySwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { currency, setCurrency, supportedCurrencies } = useCurrency()

  if (supportedCurrencies.length <= 1) return null

  return (
    <select
      aria-label="Ship to"
      className={className ?? 'select select-ghost select-sm w-auto'}
      onChange={(e) => setCurrency(e.target.value)}
      value={currency.code}
    >
      {supportedCurrencies.map((supported) => {
        const shipTo = SHIP_TO_COUNTRY[supported.code]

        return (
          <option key={supported.code} value={supported.code}>
            {shipTo ? `${shipTo.flag} Ship to ${shipTo.country}` : `${supported.symbol} ${supported.code}`}
          </option>
        )
      })}
    </select>
  )
}
