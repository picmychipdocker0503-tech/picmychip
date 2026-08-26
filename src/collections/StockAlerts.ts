import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { publicAccess } from '@/access/publicAccess'

export const StockAlerts: CollectionConfig = {
  slug: 'stock-alerts',
  access: {
    create: publicAccess,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    group: 'Sales',
    components: {
      beforeList: ['@/components/admin/StockAlertsListStats#StockAlertsListStats'],
      views: {
        list: {
          Component: '@/components/admin/collections/StockAlertsListView#StockAlertsListView',
        },
      },
    },
    defaultColumns: ['product', 'email', 'notifiedAt', 'createdAt'],
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'variant',
      type: 'relationship',
      relationTo: 'variants',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'notifiedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        components: {
          Cell: '@/components/admin/cells/StockAlertStatusCell#StockAlertStatusCell',
        },
        description: 'Set automatically once the notification email has been sent.',
      },
    },
  ],
}
