import type { AdminViewServerProps } from 'payload'

import { checkRole } from '@/access/utilities'
import { redirect } from 'next/navigation'
import React from 'react'

import { BulkProductsUploader } from './BulkProductsUploader'

export const BulkProductsView: React.FC<AdminViewServerProps> = async ({ initPageResult }) => {
  const user = initPageResult?.req?.user

  // Payload does not auto-enforce auth on custom views the way it does its
  // own built-in views — this check is the whole security boundary here.
  if (!user || !checkRole(['admin'], user)) {
    redirect(initPageResult?.redirectTo || '/admin/login')
  }

  return (
    <div className="gutter--left gutter--right" style={{ paddingBlock: '2rem' }}>
      <h1 className="mb-1 text-2xl font-bold">Bulk Product Import</h1>
      <p className="text-base-content/70 mb-6 text-sm">
        Download the template, fill it in, then upload it here to create new products or update existing
        ones (matched by SKU) — including specifications, pricing, SEO fields, and image URLs.
      </p>
      <BulkProductsUploader />
    </div>
  )
}
