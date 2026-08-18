import { getPayload } from 'payload'
import config from '../../src/payload.config.js'
import type { User } from '../../src/payload-types.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

export const testAdminUser = {
  email: 'admin-dev@payloadcms.com',
  password: 'test',
}

/**
 * Seeds a test user for e2e admin tests. Pass `roles` to seed an admin-capable
 * user (e.g. for `adminOnly`-gated collections like Coupons) instead of the
 * default `['customer']`.
 */
export async function seedTestUser(user = testUser, roles?: User['roles']): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: user.email,
      },
    },
  })

  // Create fresh test user, pre-verified — Users has `auth.verify` enabled,
  // so an unverified seeded user would fail login with a 403.
  await payload.create({
    collection: 'users',
    data: { ...user, ...(roles ? { roles } : {}), _verified: true },
    overrideAccess: true,
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(user = testUser): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: user.email,
      },
    },
  })
}
