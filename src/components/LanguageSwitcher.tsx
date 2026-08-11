'use client'

import { localeLabels, locales, type Locale } from '@/lib/translations'
import { useLocale } from '@/providers/Locale'
import React from 'react'

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { locale, setLocale } = useLocale()

  return (
    <select
      aria-label="Language"
      className={className ?? 'select select-ghost select-sm w-auto'}
      onChange={(e) => setLocale(e.target.value as Locale)}
      value={locale}
    >
      {locales.map((code) => (
        <option key={code} value={code}>
          {localeLabels[code]}
        </option>
      ))}
    </select>
  )
}
