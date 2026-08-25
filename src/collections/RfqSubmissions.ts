import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { isDocumentOwner } from '@/access/isDocumentOwner'

export const RfqSubmissions: CollectionConfig = {
  slug: 'rfq-submissions',
  access: {
    // Created only via the RFQ/BOM upload server action (submitRfq.ts), which
    // uses the Local API and so bypasses this — never exposed for public
    // REST creation.
    create: adminOnly,
    delete: adminOnly,
    // Admins see everything; a logged-in customer sees only their own tickets
    // (their account's RFQ Requests page) — matches Orders/Addresses.
    read: isDocumentOwner,
    update: adminOnly,
  },
  admin: {
    group: 'Sales',
    defaultColumns: ['ticketId', 'status', 'company', 'email', 'createdAt'],
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
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Closed', value: 'closed' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
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
      name: 'company',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'gst',
      type: 'text',
      label: 'GSTIN',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'lineItems',
      type: 'array',
      admin: {
        description: 'Manually entered line items, if the customer used the multi-line RFQ grid instead of (or alongside) a BOM file upload.',
      },
      fields: [
        { name: 'mpn', type: 'text' },
        { name: 'manufacturer', type: 'text' },
        { name: 'quantity', type: 'text' },
        { name: 'targetPrice', type: 'text' },
        { name: 'leadTime', type: 'text' },
      ],
    },
    {
      name: 'bomFile',
      type: 'upload',
      relationTo: 'datasheets',
      admin: {
        description: 'The uploaded BOM spreadsheet (.xlsx/.xls/.csv), if the customer used the file-upload flow.',
      },
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
