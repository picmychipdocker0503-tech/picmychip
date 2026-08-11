import type { AdminViewServerProps } from 'payload'

import { checkRole } from '@/access/utilities'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { BulkStockTable } from './BulkStockTable'

export const BulkStockView: React.FC<AdminViewServerProps> = async ({ initPageResult }) => {
  const user = initPageResult?.req?.user

  // Payload does not auto-enforce auth on custom views the way it does its
  // own built-in views — this check is the whole security boundary here.
  if (!user || !checkRole(['admin'], user)) {
    redirect(initPageResult?.redirectTo || '/admin/login')
  }

  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 500,
    overrideAccess: false,
    sort: 'title',
    user,
    select: {
      title: true,
      slug: true,
      priceInINR: true,
      inventory: true,
      lowStockThreshold: true,
      stockStatus: true,
    },
  })

  return (
    <div className="gutter--left gutter--right" style={{ paddingBlock: '2rem' }}>
      <h1 className="mb-1 text-2xl font-bold">Bulk Stock Update</h1>
      <p className="text-base-content/70 mb-6 text-sm">
        Edit price, inventory, and low-stock threshold across products, then save all changes at once.
      </p>
      <BulkStockTable products={docs} />
    </div>
  )
}
