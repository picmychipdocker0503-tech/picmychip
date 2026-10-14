'use client'

import { useAuth } from '@/providers/Auth'
import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

// Only the dismissed-moment methods — the display/skipped ones
// (isNotDisplayed, getNotDisplayedReason, getSkippedReason, …) aren't
// supported under FedCM and make GSI log a deprecation warning.
// https://developers.google.com/identity/gsi/web/guides/fedcm-migration
type GoogleMomentNotification = {
  getDismissedReason: () => string
  isDismissedMoment: () => boolean
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
    // When the browser can't supply a credential (no Google session, a
    // cooldown after prior dismissals, third-party sign-in blocked, or an
    // origin missing from the client's Authorized JavaScript origins), GSI
    // logs its own "FedCM get() rejects with NetworkError" and shows nothing
    // — FedCM doesn't expose why, so there's nothing more to log here.
    window.google.accounts.id.prompt((notification) => {
      if (notification.isDismissedMoment() && notification.getDismissedReason() !== 'credential_returned') {
        console.info('[GoogleOneTap] dismissed:', notification.getDismissedReason())
      }
    })
  }, [clientId, scriptLoaded, user, handleCredentialResponse])

  if (!clientId) return null

  return (
    <Script onLoad={() => setScriptLoaded(true)} src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
  )
}
