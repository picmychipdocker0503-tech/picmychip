import type { Block } from 'payload'

export const CategoryGrid: Block = {
  slug: 'categoryGrid',
  interfaceName: 'CategoryGridBlock',
  labels: {
    plural: 'Category Grids',
    singular: 'Category Grid',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'categories',
      type: 'array',
      minRows: 1,
      admin: {
        description: 'Order here controls display order. 6–8 categories works best on desktop.',
      },
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional — falls back to a themed icon if left empty.',
          },
        },
      ],
    },
  ],
}
