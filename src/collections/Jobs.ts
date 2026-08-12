import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'

export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
] as const

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'department', 'location', 'employmentType', '_status'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'department',
          type: 'text',
          admin: { width: '50%' },
        },
        {
          name: 'location',
          type: 'text',
          admin: { width: '50%' },
          defaultValue: 'Remote',
        },
      ],
    },
    {
      name: 'employmentType',
      type: 'select',
      defaultValue: 'full-time',
      options: [...EMPLOYMENT_TYPE_OPTIONS],
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'One or two sentences shown on the careers list card.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Full job description — responsibilities, requirements, etc.',
      },
    },
    {
      name: 'applyUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'Where the "Apply" button goes — an external ATS link, or a mailto: link.',
      },
    },
    {
      name: 'postedDate',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  versions: {
    drafts: true,
  },
}
