import type { Block } from 'payload'

export const TrendingProducts: Block = {
  slug: 'trendingProducts',
  interfaceName: 'TrendingProductsBlock',
  labels: {
    plural: 'Trending Product Rows',
    singular: 'Trending Product Row',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Trending Now',
    },
    {
      name: 'pinnedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'Always shown first, in this order. Remaining slots auto-fill from recent sales.',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 8,
      min: 1,
    },
  ],
}
