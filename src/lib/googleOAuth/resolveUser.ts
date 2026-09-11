import type { PayloadRequest } from 'payload'

import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'
import crypto from 'crypto'

export class GoogleSignInError extends Error {}

export type GoogleIdentity = {
  email: string
  googleId: string
  name?: string
}

/**
 * Finds the storefront account for a verified Google identity — matching by
 * `googleId` first, then linking an existing email/password account with the
 * same (Google-verified) email, then falling back to creating a new
 * `customer` account. Shared by both the redirect-based OAuth flow and One
 * Tap so the two never drift into different account-matching behavior.
 *
 * Throws GoogleSignInError for an admin account: Google SSO is a
 * storefront-only feature, so a Google account can't be used to sign in to
 * the admin panel just by sharing an admin's email address.
 */
export async function findOrCreateGoogleUser(req: PayloadRequest, identity: GoogleIdentity): Promise<User> {
  const byGoogleId = await req.payload.find({
    collection: 'users',
    limit: 1,
    req,
    where: { googleId: { equals: identity.googleId } },
  })

  let user = byGoogleId.docs[0]

  if (!user) {
    const byEmail = await req.payload.find({
      collection: 'users',
      limit: 1,
      req,
      where: { email: { equals: identity.email } },
    })

    if (byEmail.docs[0]) {
      user = await req.payload.update({
        collection: 'users',
        data: { googleId: identity.googleId },
        id: byEmail.docs[0].id,
        req,
      })
    } else {
      user = await req.payload.create({
        collection: 'users',
        data: {
          _verified: true,
          email: identity.email,
          googleId: identity.googleId,
          name: identity.name,
          password: crypto.randomBytes(32).toString('hex'),
          roles: ['customer'],
        },
        disableVerificationEmail: true,
        req,
      })
    }
  }

  if (checkRole(['admin'], user)) {
    throw new GoogleSignInError("Admin accounts can't sign in with Google — please use your email and password.")
  }

  return user
}
