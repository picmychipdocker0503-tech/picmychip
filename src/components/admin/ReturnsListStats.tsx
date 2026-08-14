import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { StatCard } from './StatCard'

const ICONS = {
  inbox: (
    <path
      d="M22 12H16L14 15H10L8 12H2M5.45 5.11L2 12V18A2 2 0 004 20H20A2 2 0 0022 18V12L18.55 5.11A2 2 0 0016.76 4H7.24A2 2 0 005.45 5.11Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  check: <path d="M5 13L9 17L19 7" strokeLinecap="round" strokeLinejoin="round" />,
  x: <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round" />,
  refresh: (
    <path
      d="M23 4V10H17M1 20V14H7M20.49 9A9 9 0 005.64 5.64L1 10M22.36 14L18.36 18.36A9 9 0 013.51 15"
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

/** Rendered via ReturnRequests' `admin.components.beforeList` — a stat-card row above the table. */
export const ReturnsListStats: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })

  const [requested, approved, rejected, completed] = await Promise.all([
    payload.count({ collection: 'return-requests', where: { status: { equals: 'requested' } } }),
    payload.count({ collection: 'return-requests', where: { status: { equals: 'approved' } } }),
    payload.count({ collection: 'return-requests', where: { status: { equals: 'rejected' } } }),
    payload.count({ collection: 'return-requests', where: { status: { equals: 'completed' } } }),
  ])

  return (
    <div className="gutter--left gutter--right mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={<Icon path="inbox" />}
        label="Awaiting review"
        value={String(requested.totalDocs)}
        warn={requested.totalDocs > 0}
      />
      <StatCard icon={<Icon path="check" />} label="Approved" value={String(approved.totalDocs)} />
      <StatCard icon={<Icon path="x" />} label="Rejected" value={String(rejected.totalDocs)} />
      <StatCard icon={<Icon path="refresh" />} label="Completed" value={String(completed.totalDocs)} />
    </div>
  )
}
