import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Services: CollectionConfig = {
  slug: 'services',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
    components: {
      views: {
        list: {
          Component: '@/components/admin/collections/ServicesListView#ServicesListView',
        },
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'One-line summary shown on the homepage Services Showcase card.',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      admin: {
        description: 'Longer description shown on the service info page.',
      },
    },
    slugField(),
  ],
}
