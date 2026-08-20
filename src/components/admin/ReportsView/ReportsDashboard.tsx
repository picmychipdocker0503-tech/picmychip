import React from 'react'

import type {
  CustomerActivityReport,
  InventoryReport,
  SalesReport,
  TopProductsReport,
} from '@/lib/reports'

import { DonutChart } from '../charts/DonutChart'
import { BarRow } from './BarRow'
import { InventoryTable } from './InventoryTable'
import { RevenueTrendChart } from './RevenueTrendChart'
import { StatTile } from './StatTile'

const CATEGORY_COLORS = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-info-content)',
  'var(--theme-elevation-300)',
  'var(--color-warning)',
  'var(--theme-elevation-500)',
]

type Props = {
  customers: CustomerActivityReport
  inventory: InventoryReport
  sales: SalesReport
  topProducts: TopProductsReport
}

// Money fields (order.amount, etc.) are stored in paise — divide by 100
// before formatting, same convention as `useCurrency().formatCurrency`.
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100)

const SectionCard: React.FC<{ children: React.ReactNode; description?: string; title: string }> = ({
  title,
  description,
  children,
}) => (
  <div className="border-base-content/10 bg-base-100/40 pmc-rounded-box flex flex-col gap-4 border p-5 shadow-md backdrop-blur-xl">
    <div>
      <h2 className="text-base-content text-lg font-semibold">{title}</h2>
      {description && <p className="text-base-content/60 text-sm">{description}</p>}
    </div>
    {children}
  </div>
)

export const ReportsDashboard: React.FC<Props> = ({ sales, inventory, topProducts, customers }) => {
  const maxProductUnits = Math.max(...topProducts.topProducts.map((p) => p.unitsSold), 1)
  const maxCategoryRevenue = Math.max(...topProducts.topCategories.map((c) => c.revenue), 1)
  const maxCustomerSpend = Math.max(...customers.topCustomers.map((c) => c.totalSpent), 1)

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Sales & Revenue" description="Last 30 days, excluding cancelled/refunded orders.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Revenue" value={formatCurrency(sales.totalRevenue)} />
          <StatTile label="Orders" value={String(sales.orderCount)} />
          <StatTile label="Average order value" value={formatCurrency(sales.averageOrderValue)} />
        </div>
        <div>
          <p className="text-base-content/60 mb-2 text-xs font-semibold uppercase">Daily revenue — last 14 days</p>
          <RevenueTrendChart data={sales.revenueByDay} formatCurrency={formatCurrency} />
        </div>
      </SectionCard>

      <SectionCard title="Inventory" description="Live stock status across the catalog.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatTile label="Out of stock" value={String(inventory.outOfStockCount)} warn={inventory.outOfStockCount > 0} />
          <StatTile label="Low stock" value={String(inventory.lowStockCount)} warn={inventory.lowStockCount > 0} />
        </div>
        {inventory.lowStock.length > 0 && <InventoryTable lowStock={inventory.lowStock} />}
      </SectionCard>

      <SectionCard title="Top Products & Categories" description="By units sold / revenue, all-time within the recent order window.">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="text-base-content/60 mb-3 text-xs font-semibold uppercase">Top products (units sold)</p>
            <div className="flex flex-col gap-2.5">
              {topProducts.topProducts.length === 0 && <p className="text-base-content/50 text-sm">No sales yet.</p>}
              {topProducts.topProducts.map((product) => (
                <BarRow
                  key={product.title}
                  label={product.title}
                  value={String(product.unitsSold)}
                  valueRaw={product.unitsSold}
                  maxValue={maxProductUnits}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-base-content/60 mb-3 text-xs font-semibold uppercase">Top categories (revenue)</p>
            {topProducts.topCategories.length === 0 ? (
              <p className="text-base-content/50 text-sm">No sales yet.</p>
            ) : (
              <>
                <DonutChart
                  segments={topProducts.topCategories.map((category, index) => ({
                    label: category.title,
                    value: category.revenue,
                    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                  }))}
                  size={96}
                />
                <div className="mt-3 flex flex-col gap-2.5">
                  {topProducts.topCategories.map((category) => (
                    <BarRow
                      key={category.title}
                      label={category.title}
                      value={formatCurrency(category.revenue)}
                      valueRaw={category.revenue}
                      maxValue={maxCategoryRevenue}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Customer Activity" description="Last 30 days for new-customer count; all-time for order history.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="New customers" value={String(customers.newCustomers)} />
          <StatTile label="Returning customers" value={String(customers.returningCustomers)} />
          <StatTile label="Total customers" value={String(customers.totalCustomers)} />
        </div>
        {customers.topCustomers.length > 0 && (
          <div>
            <p className="text-base-content/60 mb-3 text-xs font-semibold uppercase">Top customers (spend)</p>
            <div className="flex flex-col gap-2.5">
              {customers.topCustomers.map((customer) => (
                <BarRow
                  key={customer.email}
                  label={customer.email}
                  value={formatCurrency(customer.totalSpent)}
                  valueRaw={customer.totalSpent}
                  maxValue={maxCustomerSpend}
                />
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
