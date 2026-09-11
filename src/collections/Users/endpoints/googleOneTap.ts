import type { Endpoint, PayloadRequest } from 'payload'

import { getGoogleOAuthClient } from '@/lib/googleOAuth/client'
import { findOrCreateGoogleUser, GoogleSignInError } from '@/lib/googleOAuth/resolveUser'
import { issueGoogleSessionCookie } from '@/lib/googleOAuth/session'

function errorResponse(message: string, status: number): Response {
  return Response.json({ errors: [{ message }] }, { status })
}

/**
 * POST /api/users/oauth/google/onetap — the browser-side counterpart to
 * /oauth/google: Google Identity Services' One Tap prompt hands the client a
 * signed `credential` (an ID token JWT) directly via JS, which
 * GoogleOneTapPrompt posts here rather than the code+redirect dance the
 * button-based flow uses. Verifies the token itself (no code exchange
 * needed — One Tap already did that when it issued the credential), then
 * runs through the same find-or-create/session logic as the callback
 * endpoint. Responds with JSON + Set-Cookie instead of a redirect since the
 * caller is `fetch`, not a browser navigation.
 */
export const googleOneTapEndpoint: Endpoint = {
  handler: async (req: PayloadRequest): Promise<Response> => {
    const credential = typeof req.data?.credential === 'string' ? req.data.credential : undefined
    if (!credential) return errorResponse('Missing Google credential.', 400)

    let client
    try {
      client = getGoogleOAuthClient()
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Google OAuth is not configured' })
      return errorResponse('Sign-in with Google is not available right now.', 503)
    }

    let googleId: string
    let email: string
    let name: string | undefined
    try {
      const ticket = await client.verifyIdToken({
        audience: process.env.GOOGLE_CLIENT_ID,
        idToken: credential,
      })
      const payload = ticket.getPayload()

      if (!payload?.email || !payload.email_verified || !payload.sub) {
        return errorResponse("That Google account's email isn't verified, so we can't sign you in with it.", 401)
      }

      googleId = payload.sub
      email = payload.email.toLowerCase()
      name = payload.name
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Google One Tap credential verification failed' })
      return errorResponse('Google sign-in failed. Please try again.', 401)
    }

    try {
      const user = await findOrCreateGoogleUser(req, { email, googleId, name })
      const cookie = await issueGoogleSessionCookie(req, user)

      return Response.json(
        { user },
        {
          headers: { 'Set-Cookie': cookie },
          status: 200,
        },
      )
    } catch (err) {
      if (err instanceof GoogleSignInError) return errorResponse(err.message, 403)
      req.payload.logger.error({ err, msg: 'Google One Tap login failed' })
      return errorResponse('Google sign-in failed. Please try again.', 500)
    }
  },
  method: 'post',
  path: '/oauth/google/onetap',
}
