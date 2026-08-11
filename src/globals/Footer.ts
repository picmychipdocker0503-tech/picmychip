import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateGlobal('footer')],
  },
  fields: [
    {
      name: 'newsletterHeading',
      type: 'text',
      defaultValue: "Don't Miss Out Latest Trends & Offers",
      admin: {
        description: 'e.g. "to get promotional offers & discounts"',
      },
    },
    {
      name: 'newsletterCopy',
      type: 'text',
      defaultValue: 'Register to receive news about the latest offers & discount codes',
    },
    {
      name: 'columns',
      type: 'array',
      maxRows: 5,
      admin: {
        description: 'Link columns, e.g. "Information", "My Account", "Services", "Policies".',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'links',
          type: 'array',
          maxRows: 8,
          fields: [link({ appearances: false })],
        },
      ],
    },
    {
      name: 'navItems',
      type: 'array',
      admin: {
        description: 'Legacy flat link row, kept for backward compatibility — prefer Columns above.',
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
  ],
}
