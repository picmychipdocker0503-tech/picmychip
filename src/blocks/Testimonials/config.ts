import type { Block } from 'payload'

export const Testimonials: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: {
    plural: 'Testimonials Sections',
    singular: 'Testimonials Section',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'What Makers Are Saying',
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Manual (curated)', value: 'manual' },
        { label: 'Verified Reviews (auto-pull)', value: 'reviews' },
        { label: 'Community Feedback (auto-pull)', value: 'communityFeedback' },
      ],
    },
    {
      name: 'testimonials',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'manual',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'role',
          type: 'text',
          admin: {
            description: 'e.g. "Robotics student" or "Hobbyist maker"',
          },
        },
        {
          name: 'rating',
          type: 'number',
          required: true,
          min: 1,
          max: 5,
          defaultValue: 5,
        },
        {
          name: 'quote',
          type: 'textarea',
          required: true,
        },
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
        },
      ],
    },
    {
      name: 'minRating',
      type: 'number',
      defaultValue: 4,
      min: 1,
      max: 5,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'reviews',
        description: 'Only pull reviews rated at least this high.',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 6,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'reviews' || siblingData.populateBy === 'communityFeedback',
      },
    },
  ],
}
