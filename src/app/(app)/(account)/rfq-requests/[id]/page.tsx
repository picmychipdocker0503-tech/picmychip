import type { RfqSubmission } from '@/payload-types'
import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RfqStatusBadge } from '@/components/RfqRequestItem'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function RfqRequestPage({ params }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { id } = await params

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Please login to access your RFQ requests.')}`)
  }

  let submission: RfqSubmission | null = null

  try {
    submission = await payload.findByID({
      collection: 'rfq-submissions',
      id,
      user,
      overrideAccess: false,
      depth: 1,
    })
  } catch (error) {
    return notFound()
  }

  if (!submission) return notFound()

  const lineItems = submission.lineItems ?? []

  return (
    <div className="border p-8 rounded-lg bg-primary-foreground w-full">
      <Button asChild variant="link" className="pl-0 mb-4">
        <Link href="/rfq-requests">
          <ChevronLeftIcon className="size-4" />
          Back to RFQ Requests
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium font-mono">{submission.ticketId}</h1>
          <time dateTime={submission.createdAt} className="text-primary/50 text-sm">
            Submitted {formatDateTime({ date: submission.createdAt, format: 'MMMM dd, yyyy' })}
          </time>
        </div>
        <RfqStatusBadge status={submission.status} />
      </div>

      {lineItems.length > 0 && (
        <div className="mb-8 overflow-x-auto">
          <h2 className="text-lg font-medium mb-4">Line Items</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">MPN</th>
                <th className="py-2 pr-4">Manufacturer</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Target Price</th>
                <th className="py-2">Target Lead Time</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-2 pr-4">{item.mpn}</td>
                  <td className="py-2 pr-4">{item.manufacturer}</td>
                  <td className="py-2 pr-4">{item.quantity}</td>
                  <td className="py-2 pr-4">{item.targetPrice}</td>
                  <td className="py-2">{item.leadTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {submission.bomFile && typeof submission.bomFile === 'object' && submission.bomFile.url && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-2">BOM File</h2>
          <Button asChild variant="outline">
            <a href={submission.bomFile.url} target="_blank" rel="noopener noreferrer">
              Download {submission.bomFile.filename}
            </a>
          </Button>
        </div>
      )}

      {submission.message && (
        <div>
          <h2 className="text-lg font-medium mb-2">Message</h2>
          <p className="text-primary/80 whitespace-pre-wrap">{submission.message}</p>
        </div>
      )}
    </div>
  )
}

export const metadata: Metadata = {
  description: 'RFQ request details.',
  openGraph: mergeOpenGraph({
    title: 'RFQ Request',
    url: '/rfq-requests',
  }),
  title: 'RFQ Request',
}
