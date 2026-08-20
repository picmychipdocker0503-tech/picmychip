import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { StatCard } from './StatCard'

const ICONS = {
  bag: (
    <path
      d="M9 2L3 6V20A2 2 0 005 22H19A2 2 0 0021 20V6L15 2M9 2H15M9 2V6H15V2"
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
  flag: (
    <path
      d="M4 21V4M4 4H18L15 8.5L18 13H4"
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

// Money fields (order.amount, etc.) are stored in paise — divide by 100
// before formatting, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

/** Rendered via Orders' `admin.components.beforeList` — a stat-card row above the table. */
export const OrdersListStats: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })

  const [total, processing, completedOrders, flagged] = await Promise.all([
    payload.count({ collection: 'orders' }),
    payload.count({ collection: 'orders', where: { status: { equals: 'processing' } } }),
    payload.find({
      collection: 'orders',
      where: { status: { equals: 'completed' } },
      limit: 0,
      pagination: false,
      select: { amount: true },
    }),
    payload.count({ collection: 'orders', where: { flaggedForReview: { equals: true } } }),
  ])

  const revenue = completedOrders.docs.reduce((sum, order) => sum + (order.amount || 0), 0)

  return (
    <div className="gutter--left gutter--right mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={<Icon path="bag" />} label="Total orders" value={String(total.totalDocs)} />
      <StatCard icon={<Icon path="clock" />} label="Processing" value={String(processing.totalDocs)} />
      <StatCard
        icon={<Icon path="check" />}
        label="Revenue"
        subStat={`${completedOrders.docs.length} completed orders`}
        value={formatCurrency(revenue)}
      />
      <StatCard
        icon={<Icon path="flag" />}
        label="Flagged for review"
        value={String(flagged.totalDocs)}
        warn={flagged.totalDocs > 0}
      />
    </div>
  )
}
