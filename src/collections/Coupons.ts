import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    group: 'Ecommerce',
    components: {
      // Redemption progress, shown above the save/publish controls on the edit view.
      edit: {
        beforeDocumentControls: ['@/components/admin/CouponUsageSummary#CouponUsageSummary'],
      },
    },
    defaultColumns: ['code', 'type', 'value', 'active', 'redemptionCount'],
    useAsTitle: 'code',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        components: {
          Field: '@/components/admin/GenerateCodeField#GenerateCodeField',
        },
        description: 'Case-insensitive. Stored and matched upper-cased, e.g. "WELCOME10".',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
        ],
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'percentage',
      options: [
        { label: 'Percentage off', value: 'percentage' },
        { label: 'Fixed amount off', value: 'fixed' },
      ],
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'For percentage: 0-100. For fixed: an amount in the order currency.',
      },
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'INR',
      options: [{ label: 'INR', value: 'INR' }],
      admin: {
        description: 'Only relevant for fixed-amount coupons — which currency the value is in.',
        condition: (data) => data?.type === 'fixed',
      },
    },
    {
      name: 'minOrderAmount',
      type: 'number',
      min: 0,
      admin: {
        description: 'Minimum cart subtotal (in order currency) required to apply this coupon.',
      },
    },
    {
      name: 'maxRedemptions',
      type: 'number',
      min: 1,
      admin: {
        description: 'Leave blank for unlimited redemptions.',
      },
    },
    {
      name: 'redemptionCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
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
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
