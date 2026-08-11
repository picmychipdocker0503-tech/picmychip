import type { Block } from 'payload'

export const ComparisonTable: Block = {
  slug: 'comparisonTable',
  interfaceName: 'ComparisonTableBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      minRows: 2,
      maxRows: 4,
      required: true,
      admin: {
        description: 'Pick 2-4 products to compare. Works best when they share a category spec schema.',
      },
    },
  ],
  labels: {
    plural: 'Comparison Tables',
    singular: 'Comparison Table',
  },
}
