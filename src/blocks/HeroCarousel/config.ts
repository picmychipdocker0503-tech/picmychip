import type { Block } from 'payload'

import { link } from '@/fields/link'

export const HeroCarousel: Block = {
  slug: 'heroCarousel',
  interfaceName: 'HeroCarouselBlock',
  labels: {
    plural: 'Hero Banner Carousels',
    singular: 'Hero Banner Carousel',
  },
  fields: [
    {
      name: 'slides',
      type: 'array',
      labels: {
        plural: 'Slides',
        singular: 'Slide',
      },
      fields: [
        {
          name: 'layout',
          type: 'select',
          defaultValue: 'fullBleed',
          options: [
            { label: 'Full-bleed image', value: 'fullBleed' },
            { label: 'Split (text left, image right)', value: 'split' },
          ],
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'mobileImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional — falls back to the image above if left empty.',
          },
        },
        {
          name: 'badge',
          type: 'text',
          admin: {
            description: 'Optional small badge, e.g. "New" or "Limited stock".',
          },
        },
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'subheading',
          type: 'textarea',
          admin: {
            description: 'One line renders as plain text. Enter two or more lines to render them as a bullet list instead.',
          },
        },
        link({ appearances: false, disableLabel: false }),
      ],
    },
  ],
}
