import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const TeamTestimonials: CollectionConfig = {
  slug: 'team-testimonials',
  labels: {
    plural: 'Team Testimonials',
    singular: 'Team Testimonial',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['name', 'designation', 'department', 'featured', 'updatedAt'],
    useAsTitle: 'name',
    description:
      'What the team thinks about working here — real quotes from real employees, shown on the "People & Culture" page. Only add quotes you have permission to publish.',
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
      label: 'Role / Title',
      admin: {
        description: 'e.g. "Firmware Engineer", "Warehouse Lead".',
      },
    },
    {
      name: 'department',
      type: 'text',
      admin: {
        description: 'e.g. "Engineering", "Operations", "Customer Support".',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      admin: {
        description: 'What they would say about working at Picmychip, in their own words.',
      },
    },
    {
      name: 'yearsAtCompany',
      type: 'number',
      label: 'Years at Picmychip',
      min: 0,
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Only featured quotes are shown on the People & Culture page.',
      },
    },
  ],
}
