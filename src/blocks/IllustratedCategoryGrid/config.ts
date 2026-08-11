import type { Block } from 'payload'

export const IllustratedCategoryGrid: Block = {
  slug: 'illustratedCategoryGrid',
  interfaceName: 'IllustratedCategoryGridBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      minRows: 1,
      required: true,
    },
  ],
  labels: {
    plural: 'Illustrated Category Grids',
    singular: 'Illustrated Category Grid',
  },
}
