'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/providers/Auth'
import { useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'

/**
 * EcommerceProvider keeps its own copy of the logged-in user, populated by a
 * one-time fetch when it first mounts at the app root. Since it never
 * remounts on client-side navigation, that copy goes stale the moment
 * someone logs in or out without a full page reload — createAddress /
 * updateAddress then throw "User must be logged in" even though
 * @/providers/Auth correctly shows them as logged in. Re-sync the plugin's
 * user via its own onLogin/onLogout whenever our auth status changes.
 */
export const EcommerceAuthSync: React.FC = () => {
  const { status } = useAuth()
  const { onLogin, onLogout } = useEcommerce()
  const lastStatus = useRef<typeof status>(undefined)

  useEffect(() => {
    if (status === lastStatus.current) return
    lastStatus.current = status

    if (status === 'loggedIn') {
      void onLogin()
    } else if (status === 'loggedOut') {
      onLogout()
    }
  }, [status, onLogin, onLogout])

  return null
}
