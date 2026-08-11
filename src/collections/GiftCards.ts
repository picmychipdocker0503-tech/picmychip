import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const generateGiftCardCode = () => `GC-${crypto.randomUUID().split('-')[0].toUpperCase()}`

export const GiftCards: CollectionConfig = {
  slug: 'gift-cards',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    group: 'Ecommerce',
    defaultColumns: ['code', 'balance', 'currency', 'status', 'recipientEmail'],
    useAsTitle: 'code',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      defaultValue: generateGiftCardCode,
      admin: {
        description: 'Redemption code — auto-generated, but editable for manually-issued cards.',
      },
    },
    {
      name: 'initialAmount',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'balance',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Remaining redeemable balance. Decremented automatically on redemption.',
      },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'INR',
      options: [{ label: 'INR', value: 'INR' }],
    },
    {
      name: 'recipientEmail',
      type: 'email',
      admin: {
        description: 'Who the card was issued to / purchased for.',
      },
    },
    {
      name: 'purchasedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sourceOrder',
      type: 'relationship',
      relationTo: 'orders',
      admin: {
        position: 'sidebar',
        description: 'The order that purchased this gift card, if any.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Redeemed', value: 'redeemed' },
        { label: 'Expired', value: 'expired' },
        { label: 'Disabled', value: 'disabled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'redemptions',
      type: 'array',
      admin: {
        description: 'Audit log of partial/full redemptions against this card.',
      },
      fields: [
        {
          name: 'orderRef',
          type: 'relationship',
          relationTo: 'orders',
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
        },
        {
          name: 'redeemedAt',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
        },
      ],
    },
  ],
}
