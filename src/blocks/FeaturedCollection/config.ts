import type { Block } from 'payload'

import { link } from '@/fields/link'

export const FeaturedCollection: Block = {
  slug: 'featuredCollection',
  interfaceName: 'FeaturedCollectionBlock',
  labels: {
    plural: 'Featured Collection Panels',
    singular: 'Featured Collection Panels',
  },
  fields: [
    {
      name: 'panels',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      admin: {
        description: 'One panel per promo banner — 2 side-by-side works best.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'copy',
          type: 'textarea',
        },
        link({ appearances: false }),
      ],
    },
  ],
}
