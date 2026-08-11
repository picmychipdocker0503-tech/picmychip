import type { Block } from 'payload'

import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      admin: {
        description: 'Small label shown above the heading, e.g. "Support".',
      },
      defaultValue: 'FAQ',
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Frequently asked questions',
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional supporting sentence shown under the heading.',
      },
    },
    {
      name: 'contactCard',
      type: 'group',
      admin: {
        description: 'Optional "Still have questions?" support card shown next to the FAQ list.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show contact card',
        },
        {
          name: 'heading',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
          defaultValue: 'Still have questions?',
        },
        {
          name: 'description',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
          defaultValue: 'Our team typically responds within a few hours.',
        },
        {
          name: 'linkLabel',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
          defaultValue: 'Contact support',
        },
        {
          name: 'linkUrl',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
          defaultValue: '/contact',
        },
      ],
      label: 'Contact Card',
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'richText',
          required: true,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
            },
          }),
        },
      ],
    },
  ],
  labels: {
    plural: 'FAQs',
    singular: 'FAQ',
  },
}
