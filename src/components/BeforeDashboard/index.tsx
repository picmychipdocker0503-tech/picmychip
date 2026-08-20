import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { AreaSparkline } from '@/components/admin/charts/AreaSparkline'
import { DonutChart } from '@/components/admin/charts/DonutChart'
import { StatCard } from '@/components/admin/StatCard'
import { getSalesReport } from '@/lib/reports'

const STAT_ICONS: Record<string, React.ReactNode> = {
  Products: (
    <path
      d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'Low Stock': (
    <path
      d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.54 21H20.46A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Orders: (
    <path
      d="M9 2L3 6V20A2 2 0 005 22H19A2 2 0 0021 20V6L15 2M9 2H15M9 2V6H15V2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'Reviews Pending': (
    <path
      d="M12 2L14.85 8.4L22 9.27L16.5 14.14L18.18 21L12 17.27L5.82 21L7.5 14.14L2 9.27L9.15 8.4L12 2Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
}

const Icon: React.FC<{ label: string }> = ({ label }) => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    {STAT_ICONS[label]}
  </svg>
)

const ACTION_ICONS: Record<string, React.ReactNode> = {
  externalLink: (
    <>
      <path d="M18 13V19A2 2 0 0116 21H5A2 2 0 013 19V8A2 2 0 015 6H11" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  plus: <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round" />,
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" />
      <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" />
      <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" />
      <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round" />
      <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" />
      <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" />
    </>
  ),
  barChart: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
      <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
    </>
  ),
  cart: (
    <path
      d="M9 22A1 1 0 109 24A1 1 0 009 22ZM20 22A1 1 0 1020 24A1 1 0 0020 22ZM1 1H5L7.68 14.39A2 2 0 009.62 16H19.4A2 2 0 0021.34 14.39L23 6H6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
}

const ActionIcon: React.FC<{ path: keyof typeof ACTION_ICONS }> = ({ path }) => (
  <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
    {ACTION_ICONS[path]}
  </svg>
)

// Money fields (order.amount, etc.) are stored in paise — divide by 100
// before formatting, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

const STOCK_SEGMENT_COLORS: Record<string, string> = {
  'in-stock': 'var(--color-success)',
  'low-stock': 'var(--color-warning)',
  'out-of-stock': 'var(--color-error)',
  backorder: 'var(--theme-elevation-300)',
}

const STOCK_LABELS: Record<string, string> = {
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
  backorder: 'Backorder',
}

export const BeforeDashboard: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })

  const [products, lowStock, orders, pendingReviews, sales, stockBreakdown] = await Promise.all([
    payload.count({ collection: 'products' }),
    payload.count({ collection: 'products', where: { stockStatus: { equals: 'low-stock' } } }),
    payload.count({ collection: 'orders' }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'reviews', where: { status: { equals: 'pending' } } }),
    getSalesReport(payload).catch(() => null),
    Promise.all(
      Object.keys(STOCK_LABELS).map(async (status) => ({
        status,
        count: (await payload.count({ collection: 'products', where: { stockStatus: { equals: status } } }))
          .totalDocs,
      })),
    ),
  ])

  const stats = [
    { href: '/admin/collections/products', label: 'Products', value: products.totalDocs },
    { href: '/admin/collections/products', label: 'Low Stock', value: lowStock.totalDocs, warn: lowStock.totalDocs > 0 },
    { href: '/admin/collections/orders', label: 'Orders', value: orders.totalDocs },
    { href: '/admin/collections/reviews', label: 'Reviews Pending', value: pendingReviews.totalDocs },
  ]

  const stockSegments = stockBreakdown
    .filter((s) => s.count > 0)
    .map((s) => ({ label: STOCK_LABELS[s.status], value: s.count, color: STOCK_SEGMENT_COLORS[s.status] }))

  return (
    <div className="relative isolate mb-8 flex flex-col gap-4 overflow-hidden">
      {/* Blurred color orbs give the translucent cards below something to "frost" —
          without them, backdrop-blur has nothing to blur and just looks like a flat tint. */}
      <div className="bg-primary/30 pointer-events-none absolute -top-24 -left-16 -z-10 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-accent/25 pointer-events-none absolute -top-10 right-0 -z-10 h-56 w-56 rounded-full blur-3xl" />

      <div className="border-base-content/10 bg-base-100/40 pmc-rounded-box shadow-lg backdrop-blur-xl border p-6">
        <h4 className="text-base-content m-0 text-lg font-semibold">Welcome back to the Picmychip dashboard</h4>
        <p className="text-base-content/60 mt-1 mb-0 text-sm">
          Here&apos;s a live snapshot of your catalog and orders.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            href={stat.href}
            icon={<Icon label={stat.label} />}
            key={stat.label}
            label={stat.label}
            value={String(stat.value)}
            warn={stat.warn}
          />
        ))}
      </div>

      {sales && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="border-base-content/10 bg-base-100/40 pmc-rounded-box border p-4 shadow-md backdrop-blur-xl">
            <p className="text-base-content m-0 text-sm font-semibold">Revenue trend</p>
            <p className="text-base-content/50 mb-2 text-xs">Last 14 days · {formatCurrency(sales.totalRevenue)} total</p>
            <AreaSparkline data={sales.revenueByDay.map((d) => d.revenue)} />
          </div>

          {stockSegments.length > 0 && (
            <div className="border-base-content/10 bg-base-100/40 pmc-rounded-box border p-4 shadow-md backdrop-blur-xl">
              <p className="text-base-content m-0 text-sm font-semibold">Catalog stock mix</p>
              <p className="text-base-content/50 mb-3 text-xs">Across all {products.totalDocs} products</p>
              <DonutChart segments={stockSegments} />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          className="pmc-btn pmc-btn-outline pmc-btn-sm gap-1.5 rounded-full no-underline"
          href="/"
          rel="noreferrer"
          target="_blank"
        >
          <ActionIcon path="externalLink" />
          View Storefront
        </a>
        <a
          className="pmc-btn pmc-btn-outline pmc-btn-sm gap-1.5 rounded-full no-underline"
          href="/admin/collections/products/create"
        >
          <ActionIcon path="plus" />
          Add Product
        </a>
        <a className="pmc-btn pmc-btn-outline pmc-btn-sm gap-1.5 rounded-full no-underline" href="/admin/bulk-stock">
          <ActionIcon path="list" />
          Bulk Stock Update
        </a>
        <a className="pmc-btn pmc-btn-outline pmc-btn-sm gap-1.5 rounded-full no-underline" href="/admin/reports">
          <ActionIcon path="barChart" />
          Reports
        </a>
        <a
          className="pmc-btn pmc-btn-outline pmc-btn-sm gap-1.5 rounded-full no-underline"
          href="/admin/abandoned-checkouts"
        >
          <ActionIcon path="cart" />
          Abandoned Checkouts
        </a>
      </div>
    </div>
  )
}
