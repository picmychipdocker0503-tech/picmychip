import type { Payload } from 'payload'

import { abandonedCartEmailHtml, sendMail } from '@/lib/email'
import { getServerSideURL } from '@/utilities/getURL'

const MIN_INACTIVITY_HOURS = 2
const MAX_AGE_DAYS = 7

export type AbandonedCartCandidate = {
  id: number
  itemCount: number
  updatedAt: string
}

/** Same eligibility window used by the recovery-email run, exposed for the admin view's stat cards/table. */
export const findAbandonedCarts = async (payload: Payload): Promise<AbandonedCartCandidate[]> => {
  const now = Date.now()
  const inactiveSince = new Date(now - MIN_INACTIVITY_HOURS * 60 * 60 * 1000)
  const oldestEligible = new Date(now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000)

  const { docs } = await payload.find({
    collection: 'carts',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    sort: '-updatedAt',
    where: {
      and: [
        { purchasedAt: { exists: false } },
        { customer: { exists: true } },
        { updatedAt: { less_than_equal: inactiveSince.toISOString() } },
        { updatedAt: { greater_than_equal: oldestEligible.toISOString() } },
      ],
    },
  })

  return docs
    .filter((cart) => (cart.items?.length ?? 0) > 0)
    .map((cart) => ({ id: cart.id, itemCount: cart.items?.length ?? 0, updatedAt: cart.updatedAt }))
}

/**
 * Sends recovery emails for eligible abandoned carts that haven't already
 * received one. Shared by the external-cron webhook route and the admin's
 * manual "Send now" trigger — one implementation, two entry points.
 */
export const sendAbandonedCartEmails = async (payload: Payload): Promise<{ sent: number; checked: number }> => {
  const now = Date.now()
  const inactiveSince = new Date(now - MIN_INACTIVITY_HOURS * 60 * 60 * 1000)
  const oldestEligible = new Date(now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000)

  const { docs: carts } = await payload.find({
    collection: 'carts',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    where: {
      and: [
        { purchasedAt: { exists: false } },
        { customer: { exists: true } },
        { abandonedRecoveryEmailSentAt: { exists: false } },
        { updatedAt: { less_than_equal: inactiveSince.toISOString() } },
        { updatedAt: { greater_than_equal: oldestEligible.toISOString() } },
      ],
    },
  })

  const siteUrl = getServerSideURL()
  let sent = 0

  for (const cart of carts) {
    const itemCount = cart.items?.length ?? 0
    const email = typeof cart.customer === 'object' ? cart.customer?.email : undefined
    if (itemCount === 0 || !email) continue

    await sendMail(payload, {
      to: email,
      subject: 'You left something in your cart',
      html: abandonedCartEmailHtml({ itemCount, siteUrl }),
    })

    await payload.update({
      collection: 'carts',
      id: cart.id,
      data: { abandonedRecoveryEmailSentAt: new Date().toISOString() },
      overrideAccess: true,
    })

    sent += 1
  }

  return { sent, checked: carts.length }
}
