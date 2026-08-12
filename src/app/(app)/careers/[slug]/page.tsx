import type { Metadata } from 'next'

import { RichText } from '@/components/RichText'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon, MapPinIcon } from 'lucide-react'
import React from 'react'

type Args = {
  params: Promise<{
    slug: string
  }>
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

export default async function JobPage({ params }: Args) {
  const { slug } = await params
  const job = await queryJobBySlug({ slug })

  if (!job) return notFound()

  return (
    <div className="container py-16">
      <Link className="text-muted-foreground hover:text-primary mb-8 inline-flex items-center gap-1.5 text-sm" href="/careers">
        <ArrowLeftIcon className="size-4" />
        All openings
      </Link>

      <div className="max-w-2xl">
        <h1 className="mb-3 text-3xl font-bold">{job.title}</h1>
        <div className="text-muted-foreground mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {job.department && <span>{job.department}</span>}
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-4" />
              {job.location}
            </span>
          )}
          {job.employmentType && <span>{EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}</span>}
        </div>

        <a
          className="bg-primary hover:bg-primary/90 text-primary-foreground mb-10 inline-flex items-center rounded-full px-6 py-3 text-sm font-medium transition-colors"
          href={job.applyUrl}
        >
          Apply for this role
        </a>

        {job.description && <RichText data={job.description} enableGutter={false} />}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const job = await queryJobBySlug({ slug })

  if (!job) return {}

  return {
    description: job.summary || undefined,
    title: job.title,
  }
}

const queryJobBySlug = async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'jobs',
    draft: false,
    overrideAccess: false,
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
  })

  return result.docs?.[0] || null
}
