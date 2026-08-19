import type { Block } from 'payload'

export const TeamCulture: Block = {
  slug: 'teamCulture',
  interfaceName: 'TeamCultureBlock',
  labels: {
    plural: 'Team Culture Sections',
    singular: 'Team Culture Section',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Life at Picmychip',
    },
    {
      name: 'intro',
      type: 'textarea',
      admin: {
        description: 'One or two sentences under the heading.',
      },
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      options: [
        { label: 'Team Testimonials (auto-pull)', value: 'collection' },
        { label: 'Manual (curated)', value: 'manual' },
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
          name: 'designation',
          type: 'text',
          label: 'Role / Title',
        },
        {
          name: 'department',
          type: 'text',
        },
        {
          name: 'quote',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 6,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
    },
  ],
}
