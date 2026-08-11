import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
  },
  hooks: {
    afterChange: [revalidateGlobal('site-settings')],
  },
  fields: [
    {
      name: 'announcementBar',
      type: 'group',
      label: 'Announcement Bar',
      fields: [
        {
          name: 'messages',
          type: 'array',
          admin: {
            description: 'Rotates automatically when more than one message is present.',
          },
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
            link({ appearances: false, disableLabel: true }),
          ],
        },
        {
          name: 'dismissible',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'rotateSeconds',
          type: 'number',
          defaultValue: 5,
          min: 1,
        },
      ],
    },
    {
      name: 'organizationName',
      type: 'text',
    },
    {
      name: 'supportPhone',
      type: 'text',
      admin: {
        description: 'Shown in the header utility bar, e.g. "1800 266 6123".',
      },
    },
    {
      name: 'supportEmail',
      type: 'text',
      admin: {
        description: 'Shown for bulk order / B2B inquiries on product pages, e.g. "sales@Picmychip.com".',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'foundingDate',
      type: 'text',
      admin: {
        description: 'e.g. 2020-01-01',
      },
    },
    {
      name: 'taxSettings',
      type: 'group',
      label: 'GST / Tax Invoicing',
      admin: {
        description:
          'Used to generate printable GST tax invoices on orders. Confirm the applicable GST treatment with your tax advisor — this only formats what you configure here.',
      },
      fields: [
        {
          name: 'gstin',
          type: 'text',
          label: 'GSTIN',
        },
        {
          name: 'businessName',
          type: 'text',
        },
        {
          name: 'businessAddress',
          type: 'textarea',
        },
        {
          name: 'businessState',
          type: 'text',
          admin: {
            description: 'Used to label the tax split as CGST+SGST (intra-state) vs IGST (inter-state).',
          },
        },
        {
          name: 'gstRatePercent',
          type: 'number',
          defaultValue: 18,
          admin: {
            description: 'Applied rate, assumed inclusive in listed prices.',
          },
        },
      ],
    },
    {
      name: 'sameAs',
      type: 'array',
      label: 'Social / Profile Links',
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
