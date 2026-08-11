import type { Block } from 'payload'

export const BrandStrip: Block = {
  slug: 'brandStrip',
  interfaceName: 'BrandStripBlock',
  labels: {
    plural: 'Brand Strips',
    singular: 'Brand Strip',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Optional, e.g. "Trusted by 140+ brands worldwide"',
      },
    },
    {
      name: 'brands',
      type: 'relationship',
      relationTo: 'brands',
      hasMany: true,
      required: true,
    },
  ],
}
