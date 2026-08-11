import type { Block } from 'payload'

export const TrustBadgesStrip: Block = {
  slug: 'trustBadgesStrip',
  interfaceName: 'TrustBadgesStripBlock',
  labels: {
    plural: 'Trust Badge Strips',
    singular: 'Trust Badge Strip',
  },
  fields: [
    {
      name: 'badges',
      type: 'array',
      admin: {
        description: 'Leave empty to show sensible defaults (shipping, support, secure payment, returns).',
      },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          defaultValue: 'shipping',
          options: [
            { label: 'Shipping', value: 'shipping' },
            { label: 'Support', value: 'support' },
            { label: 'Secure Payment', value: 'secure' },
            { label: 'Returns', value: 'returns' },
            { label: 'Verified Specs', value: 'verified' },
          ],
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },
  ],
}
