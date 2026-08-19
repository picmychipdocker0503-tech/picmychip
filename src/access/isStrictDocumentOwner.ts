import type { Access } from 'payload'

/**
 * Like isDocumentOwner, but never bypasses for admins. Use for collections
 * where "read" must never turn into "list every customer's PII" just because
 * the logged-in account happens to hold the admin role — e.g. the addresses
 * collection, which the storefront's account page fetches unfiltered
 * (relying entirely on collection access to scope results) and which the
 * admin panel never lists anyway (plugin config marks it admin.hidden).
 * Support staff needing a specific customer's address should use the
 * shippingAddress snapshot on their Order instead.
 *
 * @returns a Where query scoping to the current user for authenticated
 * requests, false for guests
 */
export const isStrictDocumentOwner: Access = ({ req }) => {
  if (req.user?.id) {
    return {
      customer: {
        equals: req.user.id,
      },
    }
  }

  return false
}
