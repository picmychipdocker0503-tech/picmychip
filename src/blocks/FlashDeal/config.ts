import type { Block } from 'payload'

export const FlashDeal: Block = {
  slug: 'flashDeal',
  interfaceName: 'FlashDealBlock',
  labels: {
    plural: 'Flash Deal Strips',
    singular: 'Flash Deal Strip',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Flash Deal',
    },
    {
      name: 'discountBadge',
      type: 'text',
      admin: {
        description: 'e.g. "Up to 30% off"',
      },
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'The strip auto-hides once this passes.',
      },
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      options: [
        { label: 'Category', value: 'collection' },
        { label: 'Individual Selection', value: 'selection' },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
    },
    {
      name: 'selectedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'selection',
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
