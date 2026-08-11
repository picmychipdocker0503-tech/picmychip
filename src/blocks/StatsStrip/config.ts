import type { Block } from 'payload'

export const StatsStrip: Block = {
  slug: 'statsStrip',
  interfaceName: 'StatsStripBlock',
  labels: {
    singular: 'Metrics & Stats Strip',
    plural: 'Metrics & Stats Strips',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Section Heading (Optional)',
      defaultValue: 'Powering Hardware Innovation Worldwide',
    },
    {
      name: 'subheading',
      type: 'text',
      label: 'Subheading (Optional)',
      defaultValue: 'Trusted by 10,000+ makers, robotics engineers, and hardware labs.',
    },
    {
      name: 'theme',
      type: 'select',
      defaultValue: 'dark',
      label: 'Visual Theme',
      options: [
        { label: 'Dark High-Contrast', value: 'dark' },
        { label: 'Primary Brand Glow', value: 'primary' },
        { label: 'Subtle Glass Card', value: 'glass' },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Metric Items',
      minRows: 2,
      maxRows: 6,
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          label: 'Metric Value (e.g. 50,000+ or 99.9%)',
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Metric Label (e.g. Components in Stock)',
        },
        {
          name: 'description',
          type: 'text',
          label: 'Short Description / Subtitle',
        },
      ],
    },
  ],
}
