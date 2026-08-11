import type { Block } from 'payload'

export const ContentFeed: Block = {
  slug: 'contentFeed',
  interfaceName: 'ContentFeedBlock',
  labels: {
    plural: 'Content Feeds',
    singular: 'Content Feed',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Tutorials',
    },
    {
      name: 'filterBy',
      type: 'select',
      defaultValue: 'all',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Articles only', value: 'article' },
        { label: 'Videos only', value: 'video' },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 4,
      min: 1,
    },
  ],
}
