import type { Cart } from '@/payload-types'
import type { ListViewServerProps } from 'payload'

import { checkRole } from '@/access/utilities'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import type { ListApiResponse } from '../../DataTable/types'

import { CartsTable } from './CartsTable'

const DEFAULT_LIMIT = 20

const toParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '')

export const CartsListView: React.FC<ListViewServerProps> = async ({ BeforeList, searchParams, user }) => {
  if (!user || !checkRole(['admin'], user)) {
    redirect('/admin/login')
  }

  const page = Number(toParam(searchParams?.dtPage)) || 1
  const limit = Number(toParam(searchParams?.dtLimit)) || DEFAULT_LIMIT
  const sort = toParam(searchParams?.dtSort) || '-updatedAt'
  const search = toParam(searchParams?.dtSearch)

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'carts',
    depth: 1,
    limit,
    overrideAccess: false,
    page,
    sort,
    user,
    where: search ? { 'customer.email': { contains: search } } : undefined,
  })

  const initialData: ListApiResponse<Cart> = {
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
      <h1 className="mb-1 text-2xl font-bold">Carts</h1>
      <p className="text-base-content/70 mb-6 text-sm">Active, purchased, and abandoned carts.</p>
      {BeforeList}
      <CartsTable initialData={initialData} />
    </div>
  )
}
