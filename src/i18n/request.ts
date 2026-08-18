import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

import type { Locale } from './locales'

import { defaultLocale, locales } from './locales'
import en from '../../messages/en.json'

type Messages = typeof en

/**
 * Deep-merges locale-specific messages onto the English baseline so any key
 * not yet translated (e.g. newly-externalized strings with no Hindi content
 * yet) silently falls back to English instead of rendering the raw key path.
 */
function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result: Record<string, unknown> = { ...base }

  for (const key of Object.keys(override)) {
    const baseValue = base[key]
    const overrideValue = override[key]

    if (
      baseValue &&
      overrideValue &&
      typeof baseValue === 'object' &&
      typeof overrideValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(baseValue as Record<string, unknown>, overrideValue as Record<string, unknown>)
    } else {
      result[key] = overrideValue
    }
  }

  return result as T
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const stored = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale = locales.includes(stored as Locale) ? (stored as Locale) : defaultLocale

  const messages: Messages =
    locale === 'en' ? en : deepMerge(en, (await import(`../../messages/${locale}.json`)).default)

  return { locale, messages }
})
