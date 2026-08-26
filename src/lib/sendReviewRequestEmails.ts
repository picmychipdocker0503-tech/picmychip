import type { Payload } from 'payload'

import { reviewRequestEmailHtml, sendMail } from '@/lib/email'
import { getServerSideURL } from '@/utilities/getURL'

const MIN_DAYS_SINCE_COMPLETED = 3
const MAX_DAYS_SINCE_COMPLETED = 30

export type ReviewRequestCandidate = {
  id: number
  customerLabel: string
  updatedAt: string
}

const eligibilityWindow = () => {
  const now = Date.now()
  return {
    completedSince: new Date(now - MAX_DAYS_SINCE_COMPLETED * 24 * 60 * 60 * 1000),
    completedBefore: new Date(now - MIN_DAYS_SINCE_COMPLETED * 24 * 60 * 60 * 1000),
  }
}

/** Same eligibility window used by the email run, exposed for the admin view's stat cards/table. */
export const findReviewRequestCandidates = async (payload: Payload): Promise<ReviewRequestCandidate[]> => {
  const { completedSince, completedBefore } = eligibilityWindow()

  const { docs } = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    sort: '-updatedAt',
    where: {
      and: [
        { status: { equals: 'completed' } },
        { customerEmail: { exists: true } },
        { updatedAt: { less_than_equal: completedBefore.toISOString() } },
        { updatedAt: { greater_than_equal: completedSince.toISOString() } },
      ],
    },
  })

  return docs.map((order) => ({
    id: order.id,
    customerLabel:
      (typeof order.customer === 'object' ? order.customer?.name : undefined) ||
      order.customerEmail ||
      order.orderNumber ||
      `Order #${order.id}`,
    updatedAt: order.updatedAt,
  }))
}

/**
 * Sends "how was your order?" review-request emails for orders that
 * completed a few days ago and haven't already received one. Shared by the
 * external-cron webhook route and the admin's manual "Send now" trigger —
 * mirrors src/lib/sendAbandonedCartEmails.ts.
 */
export const sendReviewRequestEmails = async (payload: Payload): Promise<{ sent: number; checked: number }> => {
  const { completedSince, completedBefore } = eligibilityWindow()

  const { docs: orders } = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: {
      and: [
        { status: { equals: 'completed' } },
        { customerEmail: { exists: true } },
        { reviewRequestSentAt: { exists: false } },
        { updatedAt: { less_than_equal: completedBefore.toISOString() } },
        { updatedAt: { greater_than_equal: completedSince.toISOString() } },
      ],
    },
  })

  const siteUrl = getServerSideURL()
  let sent = 0

  for (const order of orders) {
    if (!order.customerEmail) continue

    const label = order.orderNumber || `#${order.id}`
    await sendMail(payload, {
      to: order.customerEmail,
      subject: `How was your order ${label}?`,
      html: reviewRequestEmailHtml({ id: order.id, orderNumber: order.orderNumber, siteUrl }),
      emailType: 'REVIEW_REQUEST',
      eventId: `REVIEW_REQUEST_${order.id}`,
    })

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { reviewRequestSentAt: new Date().toISOString() },
      overrideAccess: true,
    })

    sent += 1
  }

  return { sent, checked: orders.length }
}
