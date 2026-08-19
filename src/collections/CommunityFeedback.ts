import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const CommunityFeedback: CollectionConfig = {
  slug: 'community-feedback',
  labels: {
    plural: 'Community Feedback',
    singular: 'Community Feedback',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['name', 'companyName', 'designation', 'featured', 'updatedAt'],
    useAsTitle: 'name',
    components: {
      views: {
        list: {
          Component: '@/components/admin/collections/CommunityFeedbackListView#CommunityFeedbackListView',
        },
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'designation',
      type: 'text',
      admin: {
        description: 'Job title, e.g. "Senior Hardware Engineer" or "Robotics Student".',
      },
    },
    {
      name: 'companyName',
      type: 'text',
      label: 'Company Name',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'feedback',
      type: 'textarea',
      required: true,
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Only featured entries are shown when a Testimonials section pulls from Community Feedback.',
      },
    },
  ],
}
