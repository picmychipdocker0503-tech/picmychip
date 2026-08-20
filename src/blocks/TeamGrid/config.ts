import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const TeamGrid: Block = {
  slug: 'teamGrid',
  interfaceName: 'TeamGridBlock',
  labels: {
    plural: 'Team Grid Sections',
    singular: 'Team Grid Section',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Meet the Team',
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
      name: 'members',
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
          name: 'yearsAtCompany',
          type: 'number',
          label: 'Years at Picmychip',
          min: 0,
        },
        {
          name: 'story',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()],
          }),
        },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 12,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
    },
  ],
}
