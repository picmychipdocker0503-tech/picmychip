import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

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

export const BeforeDashboard: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })

  const [products, lowStock, orders, pendingReviews] = await Promise.all([
    payload.count({ collection: 'products' }),
    payload.count({ collection: 'products', where: { stockStatus: { equals: 'low-stock' } } }),
    payload.count({ collection: 'orders' }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'reviews', where: { status: { equals: 'pending' } } }),
  ])

  const stats = [
    { href: '/admin/collections/products', label: 'Products', value: products.totalDocs },
    { href: '/admin/collections/products', label: 'Low Stock', value: lowStock.totalDocs, warn: lowStock.totalDocs > 0 },
    { href: '/admin/collections/orders', label: 'Orders', value: orders.totalDocs },
    { href: '/admin/collections/reviews', label: 'Reviews Pending', value: pendingReviews.totalDocs },
  ]

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
          <Link
            className="border-base-content/10 bg-base-100/40 pmc-rounded-box hover:bg-base-100/60 group relative flex flex-col gap-3 border p-4 no-underline shadow-md backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-xl"
            href={stat.href}
            key={stat.label}
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                  stat.warn ? 'bg-warning/20 text-warning' : 'bg-primary/15 text-primary'
                }`}
              >
                <svg fill="none" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
                  {STAT_ICONS[stat.label]}
                </svg>
              </span>
              {stat.warn ? <span className="pmc-badge pmc-badge-warning pmc-badge-sm">Attention</span> : null}
            </div>
            <div>
              <div className="text-base-content text-3xl font-bold">{stat.value}</div>
              <div className="text-base-content/70 text-sm">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <a className="pmc-btn pmc-btn-outline pmc-btn-sm rounded-full no-underline" href="/" rel="noreferrer" target="_blank">
          View Storefront
        </a>
        <a className="pmc-btn pmc-btn-outline pmc-btn-sm rounded-full no-underline" href="/admin/collections/products/create">
          Add Product
        </a>
        <a className="pmc-btn pmc-btn-outline pmc-btn-sm rounded-full no-underline" href="/admin/bulk-stock">
          Bulk Stock Update
        </a>
        <a className="pmc-btn pmc-btn-outline pmc-btn-sm rounded-full no-underline" href="/admin/reports">
          Reports
        </a>
      </div>
    </div>
  )
}
