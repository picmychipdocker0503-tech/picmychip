import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

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
      'Real people, real quotes, real stories — shown on the "People & Culture" page (quote) and the "Team" page (full story). Only add people and content you have permission to publish.',
    components: {
      views: {
        list: {
          Component: '@/components/admin/collections/TeamTestimonialsListView#TeamTestimonialsListView',
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
      admin: {
        description: 'Only used when no user account is linked below — otherwise their account avatar is shown.',
      },
    },
    {
      name: 'linkedUser',
      type: 'relationship',
      relationTo: 'users',
      label: 'Linked user account',
      admin: {
        description:
          'Optional — link this person\'s real account to auto-pull their profile picture and show their email on the "Team" page. Leave blank to use the photo above only.',
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      admin: {
        description:
          'What they would say about working at Picmychip, in their own words. Optional — leave blank if you don\'t have a real quote from them yet; they\'ll still appear on the "Team" page, just not in the People & Culture quote cards, which only show people who have one.',
      },
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
      admin: {
        description:
          'Their longer story — how they got into this field, what they work on, what they\'re proud of. Shown on the "Team" page profile grid, separate from the short quote above. Optional — a person can appear on Team without one.',
      },
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
