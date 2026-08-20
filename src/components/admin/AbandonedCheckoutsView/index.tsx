import type { AdminViewServerProps } from 'payload'

import { checkRole } from '@/access/utilities'
import { StatCard } from '@/components/admin/StatCard'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { AbandonedCheckoutsTable } from './AbandonedCheckoutsTable'

const ICONS = {
  cart: (
    <path
      d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3A1 1 0 005.4 17H17M17 17A2 2 0 1017 21A2 2 0 0017 17ZM9 19A2 2 0 119 23A2 2 0 019 19Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  currency: (
    <path
      d="M12 1V23M17 5H9.5A3.5 3.5 0 006 8.5A3.5 3.5 0 009.5 12H14.5A3.5 3.5 0 0118 15.5A3.5 3.5 0 0114.5 19H6"
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

// Money fields (cart.subtotal, etc.) are stored in paise — divide by 100
// before formatting, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

export const AbandonedCheckoutsView: React.FC<AdminViewServerProps> = async ({ initPageResult }) => {
  const user = initPageResult?.req?.user

  // Payload does not auto-enforce auth on custom views the way it does its
  // own built-in views — this check is the whole security boundary here.
  if (!user || !checkRole(['admin'], user)) {
    redirect(initPageResult?.redirectTo || '/admin/login')
  }

  const payload = await getPayload({ config: configPromise })

  // Same eligibility window as the recovery-email run (2h-7d inactive,
  // has items, no completed order) — see src/lib/sendAbandonedCartEmails.ts.
  // Carts that already got a recovery email are exempted from the inactivity
  // check: sending that email itself updates the cart (to stamp
  // abandonedRecoveryEmailSentAt), which bumps `updatedAt` — without this
  // exemption an emailed cart would immediately fall out of the window and
  // vanish from the list instead of showing an "Emailed" pill.
  const now = Date.now()
  const inactiveSince = new Date(now - 2 * 60 * 60 * 1000)
  const oldestEligible = new Date(now - 7 * 24 * 60 * 60 * 1000)

  const { docs: carts } = await payload.find({
    collection: 'carts',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    sort: '-updatedAt',
    where: {
      and: [
        { purchasedAt: { exists: false } },
        { customer: { exists: true } },
        {
          or: [
            { updatedAt: { less_than_equal: inactiveSince.toISOString() } },
            { abandonedRecoveryEmailSentAt: { exists: true } },
          ],
        },
        { updatedAt: { greater_than_equal: oldestEligible.toISOString() } },
      ],
    },
  })

  const abandonedCarts = carts.filter((cart) => (cart.items?.length ?? 0) > 0)
  const totalValue = abandonedCarts.reduce((sum, cart) => sum + (cart.subtotal || 0), 0)
  const emailed = abandonedCarts.filter((cart) => cart.abandonedRecoveryEmailSentAt).length
  const notContacted = abandonedCarts.length - emailed

  return (
    <div className="gutter--left gutter--right" style={{ paddingBlock: '2rem' }}>
      <h1 className="mb-1 text-2xl font-bold">Abandoned Checkouts</h1>
      <p className="text-base-content/70 mb-6 text-sm">
        Carts with items sitting inactive for 2+ hours (up to 7 days old) that never completed checkout.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Icon path="cart" />} label="Abandoned carts" value={String(abandonedCarts.length)} />
        <StatCard icon={<Icon path="currency" />} label="Value at risk" value={formatCurrency(totalValue)} />
        <StatCard icon={<Icon path="mail" />} label="Recovery emails sent" value={String(emailed)} />
        <StatCard
          icon={<Icon path="mailOff" />}
          label="Not yet contacted"
          value={String(notContacted)}
          warn={notContacted > 0}
        />
      </div>

      <AbandonedCheckoutsTable carts={abandonedCarts} />
    </div>
  )
}
