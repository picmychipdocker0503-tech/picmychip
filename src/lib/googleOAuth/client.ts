import { OAuth2Client } from 'google-auth-library'

import { getServerSideURL } from '@/utilities/getURL'

export function getGoogleRedirectUri(): string {
  return `${getServerSideURL()}/api/users/oauth/google/callback`
}

/**
 * Throws if Google OAuth isn't configured — callers catch this to fall back
 * to a login-page error rather than a raw 500.
 */
export function getGoogleOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET).')
  }

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri: getGoogleRedirectUri(),
  })
}
