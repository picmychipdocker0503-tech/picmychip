import type { AdminViewServerProps } from 'payload'

import { checkRole } from '@/access/utilities'
import {
  getCustomerActivityReport,
  getInventoryReport,
  getSalesReport,
  getTopProductsReport,
} from '@/lib/reports'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { ReportsDashboard } from './ReportsDashboard'

export const ReportsView: React.FC<AdminViewServerProps> = async ({ initPageResult }) => {
  const user = initPageResult?.req?.user

  // Same security boundary as BulkStockView — Payload doesn't auto-enforce
  // auth on custom admin views.
  if (!user || !checkRole(['admin'], user)) {
    redirect(initPageResult?.redirectTo || '/admin/login')
  }

  const payload = await getPayload({ config: configPromise })

  const [sales, inventory, topProducts, customers] = await Promise.all([
    getSalesReport(payload),
    getInventoryReport(payload),
    getTopProductsReport(payload),
    getCustomerActivityReport(payload),
  ])

  return (
    <div className="gutter--left gutter--right" style={{ paddingBlock: '2rem' }}>
      <h1 className="mb-1 text-2xl font-bold">Reports</h1>
      <p className="text-base-content/70 mb-6 text-sm">
        Sales, inventory, product performance, and customer activity at a glance.
      </p>
      <ReportsDashboard sales={sales} inventory={inventory} topProducts={topProducts} customers={customers} />
    </div>
  )
}
