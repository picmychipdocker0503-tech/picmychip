import type { Block } from 'payload'

import { link } from '@/fields/link'

export const CustomerInteraction: Block = {
  slug: 'customerInteraction',
  interfaceName: 'CustomerInteractionBlock',
  labels: {
    plural: 'Customer Interaction Sections',
    singular: 'Customer Interaction Section',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Customer interaction',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Tell us what you are building. We will help you source it.',
    },
    {
      name: 'intro',
      type: 'textarea',
      defaultValue:
        'Get part suggestions, availability checks, bulk pricing, and build-to-order service help from one place.',
    },
    {
      name: 'channels',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      labels: {
        plural: 'Interaction Channels',
        singular: 'Interaction Channel',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          defaultValue: 'quote',
          required: true,
          options: [
            { label: 'Quote Request', value: 'quote' },
            { label: 'Technical Help', value: 'technical' },
            { label: 'Order Tracking', value: 'tracking' },
            { label: 'Service Booking', value: 'service' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'responseTime',
          type: 'text',
          defaultValue: 'Within 2 hours',
        },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      minRows: 2,
      maxRows: 4,
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'detail',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'metrics',
      type: 'array',
      maxRows: 3,
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
    },
    link({
      appearances: false,
      overrides: {
        name: 'primaryLink',
        label: 'Primary CTA',
      },
    }),
    link({
      appearances: false,
      overrides: {
        name: 'secondaryLink',
        label: 'Secondary CTA',
      },
    }),
  ],
}
