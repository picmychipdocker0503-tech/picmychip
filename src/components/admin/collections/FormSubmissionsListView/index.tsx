import type { FormSubmission } from '@/payload-types'
import type { ListViewServerProps } from 'payload'

import { checkRole } from '@/access/utilities'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import type { ListApiResponse } from '../../DataTable/types'

import { FormSubmissionsTable } from './FormSubmissionsTable'

const DEFAULT_LIMIT = 20

const toParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '')

export const FormSubmissionsListView: React.FC<ListViewServerProps> = async ({ BeforeList, searchParams, user }) => {
  if (!user || !checkRole(['admin'], user)) {
    redirect('/admin/login')
  }

  const page = Number(toParam(searchParams?.dtPage)) || 1
  const limit = Number(toParam(searchParams?.dtLimit)) || DEFAULT_LIMIT
  const sort = toParam(searchParams?.dtSort) || '-createdAt'

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'form-submissions',
    depth: 1,
    limit,
    overrideAccess: false,
    page,
    sort,
    user,
  })

  const initialData: ListApiResponse<FormSubmission> = {
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
      <h1 className="mb-1 text-2xl font-bold">Form Submissions</h1>
      <p className="text-base-content/70 mb-6 text-sm">Submissions from site forms.</p>
      {BeforeList}
      <FormSubmissionsTable initialData={initialData} />
    </div>
  )
}
