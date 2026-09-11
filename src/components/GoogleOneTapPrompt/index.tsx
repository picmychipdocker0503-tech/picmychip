'use client'

import { useAuth } from '@/providers/Auth'
import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

type GoogleMomentNotification = {
  getDismissedReason: () => string
  getNotDisplayedReason: () => string
  getSkippedReason: () => string
  isDismissedMoment: () => boolean
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            // eslint-disable-next-line no-unused-vars
            callback: (response: { credential?: string }) => void
            auto_select?: boolean
            client_id: string
            use_fedcm_for_prompt?: boolean
          }) => void
          // eslint-disable-next-line no-unused-vars
          prompt: (momentListener?: (notification: GoogleMomentNotification) => void) => void
        }
      }
    }
  }
}

/**
 * Google Identity Services' "One Tap" — an ambient sign-in prompt shown in
 * the corner of the screen for anonymous visitors on any storefront page,
 * distinct from the "Continue with Google" button in LoginForm/
 * CreateAccountForm (the redirect-based OAuth flow via
 * /api/users/oauth/google). One Tap hands the client a signed credential
 * directly via JS, which gets posted to /api/users/oauth/google/onetap
 * instead of going through a code exchange.
 *
 * `clientId` is passed down from the (Server Component) layout reading
 * `process.env.GOOGLE_CLIENT_ID` — avoids needing a separate NEXT_PUBLIC_
 * copy just to hand the (non-secret) client ID to this Client Component.
 */
export const GoogleOneTapPrompt: React.FC<{ clientId?: string }> = ({ clientId }) => {
  const { loginWithGoogleCredential, user } = useAuth()
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const promptedRef = useRef(false)

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return
      try {
        await loginWithGoogleCredential(response.credential)
        toast.success('Signed in with Google.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
      }
    },
    [loginWithGoogleCredential],
  )

  useEffect(() => {
    // `user` is `undefined` while the initial /api/users/me check is still
    // in flight — wait for it to resolve to `null` (confirmed logged out)
    // rather than flashing the prompt for an already-signed-in visitor.
    if (!clientId || !scriptLoaded || user !== null || promptedRef.current) return
    if (!window.google) return

    promptedRef.current = true
    window.google.accounts.id.initialize({
      auto_select: false,
      callback: handleCredentialResponse,
      client_id: clientId,
      use_fedcm_for_prompt: true,
    })
    window.google.accounts.id.prompt((notification) => {
      // Google suppresses the prompt silently (no error thrown) for reasons
      // like an unregistered origin, a suppressed_by_user cooldown after
      // prior dismissals, or no active Google session in the browser — log
      // them so a "it just doesn't show up" report is diagnosable.
      if (notification.isNotDisplayed()) {
        console.warn('[GoogleOneTap] not displayed:', notification.getNotDisplayedReason())
      } else if (notification.isSkippedMoment()) {
        console.warn('[GoogleOneTap] skipped:', notification.getSkippedReason())
      } else if (notification.isDismissedMoment()) {
        console.warn('[GoogleOneTap] dismissed:', notification.getDismissedReason())
      }
    })
  }, [clientId, scriptLoaded, user, handleCredentialResponse])

  if (!clientId) return null

  return (
    <Script onLoad={() => setScriptLoaded(true)} src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
  )
}
