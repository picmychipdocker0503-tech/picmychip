import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

/**
 * Reference list of couriers used on Orders' shipment fields (see
 * src/plugins/index.ts's courierName relationship) — lets an admin pick a
 * courier from a dropdown instead of retyping its name, and drives the
 * auto-filled courierTrackingUrl (Orders' beforeChange hook substitutes
 * trackingNumber into trackingUrlTemplate).
 */
export const Couriers: CollectionConfig = {
  slug: 'couriers',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Sales',
    defaultColumns: ['name', 'trackingUrlTemplate'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'trackingUrlTemplate',
      type: 'text',
      admin: {
        description:
          'The courier\'s tracking page. Include {trackingNumber} where the AWB/tracking number goes — e.g. https://example.com/track?awb={trackingNumber}. Leave the placeholder out to just link to a generic tracking page.',
      },
    },
  ],
}
