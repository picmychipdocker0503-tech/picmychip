import type { Wishlist } from '@/payload-types'
import type { ListViewServerProps } from 'payload'

import { checkRole } from '@/access/utilities'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import type { ListApiResponse } from '../../DataTable/types'

import { WishlistsTable } from './WishlistsTable'

const DEFAULT_LIMIT = 20

const toParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '')

export const WishlistsListView: React.FC<ListViewServerProps> = async ({ BeforeList, searchParams, user }) => {
  if (!user || !checkRole(['admin'], user)) {
    redirect('/admin/login')
  }

  const page = Number(toParam(searchParams?.dtPage)) || 1
  const limit = Number(toParam(searchParams?.dtLimit)) || DEFAULT_LIMIT
  const sort = toParam(searchParams?.dtSort) || undefined

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'wishlists',
    depth: 1,
    limit,
    overrideAccess: false,
    page,
    sort,
    user,
  })

  const initialData: ListApiResponse<Wishlist> = {
    docs: result.docs,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    limit: result.limit,
    page: result.page ?? 1,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }

  return (
    <div className="gutter--left gutter--right" style={{ paddingBlock: '2rem' }}>
      <h1 className="mb-1 text-2xl font-bold">Wishlists</h1>
      <p className="text-base-content/70 mb-6 text-sm">Products customers have saved for later.</p>
      {BeforeList}
      <WishlistsTable initialData={initialData} />
    </div>
  )
}
