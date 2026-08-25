import type { RfqSubmission } from '@/payload-types'
import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { RfqRequestItem } from '@/components/RfqRequestItem'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

export default async function RfqRequests() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let submissions: RfqSubmission[] | null = null

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Please login to access your RFQ requests.')}`)
  }

  try {
    const result = await payload.find({
      collection: 'rfq-submissions',
      limit: 0,
      pagination: false,
      user,
      overrideAccess: false,
      sort: '-createdAt',
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    submissions = result?.docs || []
  } catch (error) {}

  return (
    <>
      <div className="border p-8 rounded-lg bg-primary-foreground w-full">
        <h1 className="text-3xl font-medium mb-8">RFQ Requests</h1>
        {(!submissions || !Array.isArray(submissions) || submissions?.length === 0) && (
          <p className="">You haven&apos;t submitted any RFQ or BOM requests yet.</p>
        )}

        {submissions && submissions.length > 0 && (
          <ul className="flex flex-col gap-6">
            {submissions?.map((submission) => (
              <li key={submission.id}>
                <RfqRequestItem submission={submission} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Your RFQ and BOM requests.',
  openGraph: mergeOpenGraph({
    title: 'RFQ Requests',
    url: '/rfq-requests',
  }),
  title: 'RFQ Requests',
}
