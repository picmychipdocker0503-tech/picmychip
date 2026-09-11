import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'
import crypto from 'crypto'
import { generatePayloadCookie } from 'payload/shared'

/**
 * Mints a Payload session for `user` by rotating to a fresh, never-exposed
 * random password and running it through Payload's normal local-strategy
 * login. Google has already vouched for the identity, so the password check
 * itself is a formality here — this just reuses Payload's own JWT/session
 * plumbing (cookie shape, `sessions`, tokenExpiration) instead of
 * re-implementing it, since those internals aren't part of its public API.
 * Shared by both the redirect-based OAuth callback and One Tap.
 */
export async function issueGoogleSessionCookie(req: PayloadRequest, user: User): Promise<string> {
  const throwawayPassword = crypto.randomBytes(32).toString('hex')

  await req.payload.update({
    collection: 'users',
    data: { password: throwawayPassword },
    id: user.id,
    req,
  })

  const { token } = await req.payload.login({
    collection: 'users',
    data: { email: user.email, password: throwawayPassword },
    req,
  })

  return generatePayloadCookie({
    collectionAuthConfig: req.payload.collections.users.config.auth,
    cookiePrefix: req.payload.config.cookiePrefix,
    token: token as string,
  })
}
