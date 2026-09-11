import type { Endpoint, PayloadRequest } from 'payload'

import { getGoogleOAuthClient } from '@/lib/googleOAuth/client'
import { createOAuthState } from '@/lib/googleOAuth/state'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * GET /api/users/oauth/google — kicks off "Sign in with Google" by
 * redirecting to Google's consent screen. `redirect` is the storefront path
 * to send the user back to after a successful login (defaults to /account).
 */
export const googleOAuthStartEndpoint: Endpoint = {
  handler: async (req: PayloadRequest): Promise<Response> => {
    const url = new URL(req.url || '', 'http://localhost')
    const redirectTo = url.searchParams.get('redirect') || '/account'

    let client
    try {
      client = getGoogleOAuthClient()
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Google OAuth is not configured' })
      const error = encodeURIComponent('Sign-in with Google is not available right now.')
      return Response.redirect(`${getServerSideURL()}/login?error=${error}`, 302)
    }

    const authUrl = client.generateAuthUrl({
      access_type: 'online',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state: createOAuthState(req.payload.secret, redirectTo),
    })

    return Response.redirect(authUrl, 302)
  },
  method: 'get',
  path: '/oauth/google',
}
