import type { AdminViewServerProps } from 'payload'

import { checkRole } from '@/access/utilities'
import { StatCard } from '@/components/admin/StatCard'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { ReviewRequestsTable } from './ReviewRequestsTable'

const ICONS = {
  star: (
    <path
      d="M12 2L14.9 8.5L22 9.3L16.7 14.1L18.2 21L12 17.4L5.8 21L7.3 14.1L2 9.3L9.1 8.5L12 2Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  mail: (
    <path
      d="M4 4H20A2 2 0 0122 6V18A2 2 0 0120 20H4A2 2 0 012 18V6A2 2 0 014 4ZM22 6L12 13L2 6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  mailOff: (
    <path
      d="M22 6L13.5 12M8 8.5L2 6M4 4H20A2 2 0 0122 6V18A2 2 0 0120 20H4A2 2 0 012 18V6A2 2 0 014 4ZM2 2L22 22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
}

const Icon: React.FC<{ path: keyof typeof ICONS }> = ({ path }) => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    {ICONS[path]}
  </svg>
)

const MIN_DAYS_SINCE_COMPLETED = 3
const MAX_DAYS_SINCE_COMPLETED = 30

export const ReviewRequestsView: React.FC<AdminViewServerProps> = async ({ initPageResult }) => {
  const user = initPageResult?.req?.user

  // Payload does not auto-enforce auth on custom views the way it does its
  // own built-in views — this check is the whole security boundary here.
  if (!user || !checkRole(['admin'], user)) {
    redirect(initPageResult?.redirectTo || '/admin/login')
  }

  const payload = await getPayload({ config: configPromise })

  // Same eligibility window as the email run (3-30 days since the order
  // completed) — see src/lib/sendReviewRequestEmails.ts. Orders that already
  // got a review-request email are exempted from the window check: sending
  // that email updates the order (to stamp reviewRequestSentAt), which bumps
  // `updatedAt` — without this exemption an emailed order would fall out of
  // the window and vanish from the list instead of showing an "Emailed" pill.
  const now = Date.now()
  const completedSince = new Date(now - MAX_DAYS_SINCE_COMPLETED * 24 * 60 * 60 * 1000)
  const completedBefore = new Date(now - MIN_DAYS_SINCE_COMPLETED * 24 * 60 * 60 * 1000)

  const { docs: orders } = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    sort: '-updatedAt',
    where: {
      and: [
        { status: { equals: 'completed' } },
        { customerEmail: { exists: true } },
        {
          or: [
            { updatedAt: { less_than_equal: completedBefore.toISOString() } },
            { reviewRequestSentAt: { exists: true } },
          ],
        },
        { updatedAt: { greater_than_equal: completedSince.toISOString() } },
      ],
    },
  })

  const requested = orders.filter((order) => order.reviewRequestSentAt).length
  const notContacted = orders.length - requested

  return (
    <div className="gutter--left gutter--right" style={{ paddingBlock: '2rem' }}>
      <h1 className="mb-1 text-2xl font-bold">Review Requests</h1>
      <p className="text-base-content/70 mb-6 text-sm">
        Completed orders from the last {MIN_DAYS_SINCE_COMPLETED}–{MAX_DAYS_SINCE_COMPLETED} days — good candidates for a
        "how was your order?" nudge.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={<Icon path="star" />} label="Eligible orders" value={String(orders.length)} />
        <StatCard icon={<Icon path="mail" />} label="Requests sent" value={String(requested)} />
        <StatCard
          icon={<Icon path="mailOff" />}
          label="Not yet contacted"
          value={String(notContacted)}
          warn={notContacted > 0}
        />
      </div>

      <ReviewRequestsTable orders={orders} />
    </div>
  )
}
