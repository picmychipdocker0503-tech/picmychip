import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { StatCard } from './StatCard'

const ICONS = {
  box: (
    <path
      d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  check: <path d="M5 13L9 17L19 7" strokeLinecap="round" strokeLinejoin="round" />,
  warning: (
    <path
      d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.54 21H20.46A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  x: (
    <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round" />
  ),
}

const Icon: React.FC<{ path: keyof typeof ICONS }> = ({ path }) => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    {ICONS[path]}
  </svg>
)

/** Rendered via Products' `admin.components.beforeList` — a stat-card row above the table. */
export const ProductsListStats: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })

  const [total, published, lowStock, outOfStock] = await Promise.all([
    payload.count({ collection: 'products' }),
    payload.count({ collection: 'products', where: { _status: { equals: 'published' } } }),
    payload.count({ collection: 'products', where: { stockStatus: { equals: 'low-stock' } } }),
    payload.count({ collection: 'products', where: { stockStatus: { equals: 'out-of-stock' } } }),
  ])

  return (
    <div className="gutter--left gutter--right mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={<Icon path="box" />} label="Total products" value={String(total.totalDocs)} />
      <StatCard
        icon={<Icon path="check" />}
        label="Published"
        subStat={total.totalDocs > 0 ? `${Math.round((published.totalDocs / total.totalDocs) * 100)}% of catalog` : undefined}
        value={String(published.totalDocs)}
      />
      <StatCard
        icon={<Icon path="warning" />}
        label="Low stock"
        value={String(lowStock.totalDocs)}
        warn={lowStock.totalDocs > 0}
      />
      <StatCard
        icon={<Icon path="x" />}
        label="Out of stock"
        value={String(outOfStock.totalDocs)}
        warn={outOfStock.totalDocs > 0}
      />
    </div>
  )
}
