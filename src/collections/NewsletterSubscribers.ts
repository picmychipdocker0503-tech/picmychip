import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { publicAccess } from '@/access/publicAccess'
import { rateLimitCreate } from '@/hooks/rateLimitCreate'
import { sendNewsletterWelcome } from '@/hooks/sendNewsletterWelcome'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  access: {
    create: publicAccess,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  hooks: {
    beforeOperation: [rateLimitCreate('newsletter-signup', 5, 60_000)],
    afterChange: [sendNewsletterWelcome],
  },
  admin: {
    group: 'Marketing',
    defaultColumns: ['email', 'subscribedAt'],
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'subscribedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: {
        readOnly: true,
      },
    },
  ],
}
