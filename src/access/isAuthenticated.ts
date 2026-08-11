import type { Access } from 'payload'

/**
 * Any logged-in user (customer or admin) — no ownership check. Used where
 * every authenticated user should be able to create a document, but not
 * necessarily read/update/delete others' (gate those separately).
 */
export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)
