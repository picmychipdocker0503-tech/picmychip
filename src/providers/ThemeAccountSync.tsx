'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { themeIsValid } from '@/providers/Theme/types'

/**
 * Pulls the logged-in user's saved theme preference once per login, so it
 * follows them across devices/browsers instead of only living in this
 * browser's localStorage. Saving happens in ThemeSelector itself (which
 * already knows whether "Auto" or a concrete theme was picked); this only
 * handles the pull-on-login side.
 */
export const ThemeAccountSync: React.FC = () => {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const syncedUserId = useRef<number | string | null>(null)

  useEffect(() => {
    if (!user) {
      syncedUserId.current = null
      return
    }
    if (syncedUserId.current === user.id) return
    syncedUserId.current = user.id

    const preference = user.themePreference ?? null
    if (themeIsValid(preference)) {
      setTheme(preference)
    }
  }, [user, setTheme])

  return null
}
