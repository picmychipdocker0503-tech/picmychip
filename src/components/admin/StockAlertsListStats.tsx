import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { StatCard } from './StatCard'

const ICONS = {
  bell: (
    <path
      d="M18 8A6 6 0 006 8C6 15 3 17 3 17H21S18 15 18 8ZM13.73 21A2 2 0 0110.27 21"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  check: <path d="M5 13L9 17L19 7" strokeLinecap="round" strokeLinejoin="round" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7V12L15 14" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
}

const Icon: React.FC<{ path: keyof typeof ICONS }> = ({ path }) => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    {ICONS[path]}
  </svg>
)

/** Rendered via StockAlerts' `admin.components.beforeList` — a stat-card row above the table. */
export const StockAlertsListStats: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })

  const [total, pending, notified] = await Promise.all([
    payload.count({ collection: 'stock-alerts' }),
    payload.count({ collection: 'stock-alerts', where: { notifiedAt: { exists: false } } }),
    payload.count({ collection: 'stock-alerts', where: { notifiedAt: { exists: true } } }),
  ])

  return (
    <div className="gutter--left gutter--right mb-4 grid grid-cols-3 gap-3">
      <StatCard icon={<Icon path="bell" />} label="Total alerts" value={String(total.totalDocs)} />
      <StatCard icon={<Icon path="clock" />} label="Pending" value={String(pending.totalDocs)} warn={pending.totalDocs > 0} />
      <StatCard icon={<Icon path="check" />} label="Notified" value={String(notified.totalDocs)} />
    </div>
  )
}
