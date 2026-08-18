'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import type { Locale } from './locales'

export async function setLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale)
  // The locale is resolved in the root layout, so a plain `router.refresh()`
  // on the client isn't enough to bust its cache — force the whole layout
  // subtree to re-render server-side with the new cookie.
  revalidatePath('/', 'layout')
}
