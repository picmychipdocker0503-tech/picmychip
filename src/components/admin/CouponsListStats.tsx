import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { StatCard } from './StatCard'

const ICONS = {
  tag: (
    <path
      d="M20.59 13.41L13.42 20.58A2 2 0 0110.6 20.58L2 12V2H12L20.59 10.59A2 2 0 0120.59 13.41Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7V12L15 14" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  check: <path d="M5 13L9 17L19 7" strokeLinecap="round" strokeLinejoin="round" />,
}

const Icon: React.FC<{ path: keyof typeof ICONS }> = ({ path }) => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    {ICONS[path]}
  </svg>
)

/** Rendered via Coupons' `admin.components.beforeList` — a stat-card row above the table. */
export const CouponsListStats: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()

  const [active, expired, disabled, all] = await Promise.all([
    payload.count({
      collection: 'coupons',
      where: {
        and: [{ active: { equals: true } }, { or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: now } }] }],
      },
    }),
    payload.count({ collection: 'coupons', where: { expiresAt: { less_than_equal: now } } }),
    payload.count({ collection: 'coupons', where: { active: { equals: false } } }),
    payload.find({ collection: 'coupons', limit: 0, pagination: false, select: { redemptionCount: true } }),
  ])

  const totalRedemptions = all.docs.reduce((sum, coupon) => sum + (coupon.redemptionCount || 0), 0)

  return (
    <div className="gutter--left gutter--right mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={<Icon path="tag" />} label="Active coupons" value={String(active.totalDocs)} />
      <StatCard icon={<Icon path="clock" />} label="Expired" value={String(expired.totalDocs)} />
      <StatCard icon={<Icon path="tag" />} label="Disabled" value={String(disabled.totalDocs)} />
      <StatCard icon={<Icon path="check" />} label="Total redemptions" value={String(totalRedemptions)} />
    </div>
  )
}
