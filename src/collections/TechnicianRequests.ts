import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { isDocumentOwner } from '@/access/isDocumentOwner'

export const TechnicianRequests: CollectionConfig = {
  slug: 'technician-requests',
  access: {
    // Created only via the /request-technician server action
    // (submitTechnicianRequest.ts), which uses the Local API and so bypasses
    // this — never exposed for public REST creation. Mirrors RfqSubmissions.
    create: adminOnly,
    delete: adminOnly,
    read: isDocumentOwner,
    update: adminOnly,
  },
  admin: {
    group: 'Sales',
    defaultColumns: ['ticketId', 'status', 'company', 'technicians', 'location', 'createdAt'],
    useAsTitle: 'ticketId',
  },
  fields: [
    {
      name: 'ticketId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Set automatically when the submitter was logged in — blank for guest submissions.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Matched', value: 'matched' },
        { label: 'Deployed', value: 'deployed' },
        { label: 'Closed', value: 'closed' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'skills',
      type: 'text',
      admin: {
        description: 'Comma-separated skills the customer selected on the form.',
      },
    },
    {
      name: 'technicians',
      type: 'number',
      label: 'Technicians needed',
      min: 1,
    },
    {
      name: 'engagement',
      type: 'select',
      options: [
        { label: 'Onsite at customer location', value: 'onsite' },
        { label: 'At Picmychip facility', value: 'facility' },
        { label: 'Either / not sure', value: 'either' },
      ],
    },
    {
      name: 'duration',
      type: 'select',
      options: [
        { label: 'One day', value: 'day' },
        { label: 'Up to a week', value: 'week' },
        { label: 'Up to a month', value: 'month' },
        { label: 'Long term (1+ months)', value: 'long-term' },
        { label: 'Not sure yet', value: 'not-sure' },
      ],
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'City or site where the technician is needed.',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      access: {
        read: adminOnlyFieldAccess,
      },
      admin: {
        description: 'Internal follow-up notes — never shown to the customer.',
      },
    },
  ],
  timestamps: true,
}
