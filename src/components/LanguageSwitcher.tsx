'use client'

import { localeLabels, locales, type Locale } from '@/i18n/locales'
import { setLocale } from '@/i18n/setLocale'
import { useLocale } from 'next-intl'
import React, { useState } from 'react'

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const locale = useLocale()
  const [pending, setPending] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPending(true)
    await setLocale(e.target.value as Locale)
    // The locale is resolved once, server-side, in the root layout — a soft
    // App Router refresh doesn't reliably re-run that resolution, so force a
    // full reload to guarantee every server-rendered string picks it up.
    window.location.reload()
  }

  return (
    <select
      aria-label="Language"
      className={className ?? 'select select-ghost select-sm w-auto'}
      disabled={pending}
      onChange={handleChange}
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
