import type { Order, User } from '@/payload-types'
import type { Payload } from 'payload'

/**
 * Shared order-access check for customer-facing order routes/pages: a logged-in
 * user must own the order (customer === user.id); a guest must present both the
 * order's accessToken and a matching customerEmail. Factored out of the invoice
 * page so the invoice-PDF download route enforces the exact same rule instead of
 * a hand-copied duplicate that could drift out of sync.
 */
export async function getAccessibleOrder(args: {
  payload: Payload
  id: string
  user: User | null | undefined
  email?: string
  accessToken?: string
}): Promise<Order | null> {
  const { payload, id, user, email = '', accessToken = '' } = args

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user,
      overrideAccess: !Boolean(user),
      depth: 1,
      where: {
        and: [
          { id: { equals: id } },
          ...(user
            ? [{ customer: { equals: user.id } }]
            : [{ accessToken: { equals: accessToken } }, ...(email ? [{ customerEmail: { equals: email } }] : [])]),
        ],
      },
    })

    const canAccessAsGuest =
      !user && email && accessToken && orderResult && orderResult.customerEmail === email
    const canAccessAsUser =
      user &&
      orderResult &&
      (typeof orderResult.customer === 'object' ? orderResult.customer?.id : orderResult.customer) === user.id

    if (orderResult && (canAccessAsGuest || canAccessAsUser)) {
      return orderResult
    }
  } catch {
    // fall through
  }

  return null
}
