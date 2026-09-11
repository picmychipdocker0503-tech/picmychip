import type { Endpoint, PayloadRequest } from 'payload'

import { getGoogleOAuthClient } from '@/lib/googleOAuth/client'
import { findOrCreateGoogleUser, GoogleSignInError } from '@/lib/googleOAuth/resolveUser'
import { issueGoogleSessionCookie } from '@/lib/googleOAuth/session'
import { verifyOAuthState } from '@/lib/googleOAuth/state'
import { getServerSideURL } from '@/utilities/getURL'

// /login already renders `?error=` via RenderParams/Message, so these go
// straight there as plain text rather than as codes the frontend has to map.
function loginRedirect(error: string): Response {
  return Response.redirect(`${getServerSideURL()}/login?error=${encodeURIComponent(error)}`, 302)
}

/**
 * GET /api/users/oauth/google/callback — Google redirects here with either
 * `code` (consent granted) or `error` (denied). Exchanges the code, verifies
 * the ID token, finds-or-creates the matching storefront account, and signs
 * them in the same way the email/password login endpoint would.
 */
export const googleOAuthCallbackEndpoint: Endpoint = {
  handler: async (req: PayloadRequest): Promise<Response> => {
    const url = new URL(req.url || '', 'http://localhost')
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (url.searchParams.get('error')) return loginRedirect('Google sign-in was cancelled.')

    const verifiedState = verifyOAuthState(req.payload.secret, state)
    if (!verifiedState) {
      return loginRedirect('That Google sign-in link expired or is invalid. Please try again.')
    }
    if (!code) return loginRedirect('Google sign-in failed. Please try again.')

    let client
    try {
      client = getGoogleOAuthClient()
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Google OAuth is not configured' })
      return loginRedirect('Sign-in with Google is not available right now.')
    }

    let googleId: string
    let email: string
    let name: string | undefined
    try {
      const { tokens } = await client.getToken(code)
      if (!tokens.id_token) throw new Error('Google did not return an id_token')

      const ticket = await client.verifyIdToken({
        audience: process.env.GOOGLE_CLIENT_ID,
        idToken: tokens.id_token,
      })
      const payload = ticket.getPayload()

      if (!payload?.email || !payload.email_verified || !payload.sub) {
        return loginRedirect('That Google account\'s email isn\'t verified, so we can\'t sign you in with it.')
      }

      googleId = payload.sub
      email = payload.email.toLowerCase()
      name = payload.name
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Google OAuth token exchange/verification failed' })
      return loginRedirect('Google sign-in failed. Please try again.')
    }

    try {
      const user = await findOrCreateGoogleUser(req, { email, googleId, name })
      const cookie = await issueGoogleSessionCookie(req, user)

      return new Response(null, {
        headers: {
          Location: `${getServerSideURL()}${verifiedState.redirectTo}`,
          'Set-Cookie': cookie,
        },
        status: 302,
      })
    } catch (err) {
      if (err instanceof GoogleSignInError) return loginRedirect(err.message)
      req.payload.logger.error({ err, msg: 'Google OAuth login failed' })
      return loginRedirect('Google sign-in failed. Please try again.')
    }
  },
  method: 'get',
  path: '/oauth/google/callback',
}
