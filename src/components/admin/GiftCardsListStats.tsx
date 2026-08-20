import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { StatCard } from './StatCard'

const ICONS = {
  gift: (
    <path
      d="M20 12V22H4V12M2 7H22V12H2V7ZM12 22V7M12 7H7.5A2.5 2.5 0 015 4.5A2.5 2.5 0 017.5 2C11 2 12 7 12 7ZM12 7H16.5A2.5 2.5 0 0019 4.5A2.5 2.5 0 0016.5 2C13 2 12 7 12 7Z"
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
  currency: (
    <path
      d="M12 1V23M17 5H9.5A3.5 3.5 0 006 8.5A3.5 3.5 0 009.5 12H14.5A3.5 3.5 0 0118 15.5A3.5 3.5 0 0114.5 19H6"
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

// Money fields (gift card balance, etc.) are stored in paise — divide by
// 100 before formatting, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

/** Rendered via Gift Cards' `admin.components.beforeList` — a stat-card row above the table. */
export const GiftCardsListStats: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })

  const [active, redeemed, expired, activeCards] = await Promise.all([
    payload.count({ collection: 'gift-cards', where: { status: { equals: 'active' } } }),
    payload.count({ collection: 'gift-cards', where: { status: { equals: 'redeemed' } } }),
    payload.count({ collection: 'gift-cards', where: { status: { equals: 'expired' } } }),
    payload.find({
      collection: 'gift-cards',
      where: { status: { equals: 'active' } },
      limit: 0,
      pagination: false,
      select: { balance: true },
    }),
  ])

  const outstandingBalance = activeCards.docs.reduce((sum, card) => sum + (card.balance || 0), 0)

  return (
    <div className="gutter--left gutter--right mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={<Icon path="gift" />} label="Active gift cards" value={String(active.totalDocs)} />
      <StatCard icon={<Icon path="currency" />} label="Outstanding balance" value={formatCurrency(outstandingBalance)} />
      <StatCard icon={<Icon path="check" />} label="Redeemed" value={String(redeemed.totalDocs)} />
      <StatCard icon={<Icon path="clock" />} label="Expired" value={String(expired.totalDocs)} />
    </div>
  )
}
