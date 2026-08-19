import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { ArrowRightIcon, MapPinIcon } from 'lucide-react'
import React from 'react'

export const metadata: Metadata = {
  description: 'Open roles at Picmychip — browse current openings and apply.',
  title: 'Careers',
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

export default async function CareersPage() {
  const payload = await getPayload({ config: configPromise })

  const { docs: jobs } = await payload.find({
    collection: 'jobs',
    draft: false,
    overrideAccess: false,
    limit: 100,
    sort: '-postedDate',
    where: { _status: { equals: 'published' } },
    select: {
      title: true,
      slug: true,
      department: true,
      location: true,
      employmentType: true,
      summary: true,
    },
  })

  return (
    <div className="container py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="mb-3 text-3xl font-bold">Careers</h1>
        <p className="text-muted-foreground">
          We're building the sourcing platform makers rely on. Here's what we're hiring for right now.
        </p>
        <Link className="text-primary mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline" href="/people-culture">
          See what our team says about working here
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>

      {jobs.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                className="card-hover bg-card border-border group flex flex-col gap-3 rounded-2xl border p-6 transition-colors sm:flex-row sm:items-center sm:justify-between"
                href={`/careers/${job.slug}`}
              >
                <div>
                  <div className="group-hover:text-primary font-semibold transition-colors">{job.title}</div>
                  {job.summary && <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{job.summary}</p>}
                  <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    {job.department && <span>{job.department}</span>}
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="size-3.5" />
                        {job.location}
                      </span>
                    )}
                    {job.employmentType && (
                      <span>{EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}</span>
                    )}
                  </div>
                </div>
                <ArrowRightIcon className="text-muted-foreground group-hover:text-primary size-5 shrink-0 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No open roles right now — check back soon.</p>
      )}
    </div>
  )
}
