import type { Access, CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { adminOrCustomerOwner } from '@/access/adminOrCustomerOwner'
import { checkRole } from '@/access/utilities'

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

/**
 * A non-admin's own user ID always wins for `customer`, regardless of what
 * the request body claims — prevents saving items to someone else's
 * wishlist. Also snapshots the product's current price so later price-drop
 * comparisons have a baseline (see src/hooks/notifyWishlistChanges.ts).
 */
const forceOwnCustomerAndSnapshotPrice: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  const next = { ...data }

  if (req.user && !checkRole(['admin'], req.user)) {
    next.customer = req.user.id
  }

  if (next.product && typeof next.priceAtAdd !== 'number') {
    const product = await req.payload.findByID({
      collection: 'products',
      id: next.product,
      depth: 0,
      overrideAccess: true,
    })
    next.priceAtAdd = product?.priceInINR ?? undefined
  }

  return next
}

export const Wishlists: CollectionConfig = {
  slug: 'wishlists',
  access: {
    create: isAuthenticated,
    delete: adminOrCustomerOwner,
    read: adminOrCustomerOwner,
    update: adminOrCustomerOwner,
  },
  admin: {
    group: 'Sales',
    defaultColumns: ['customer', 'product', 'priceAtAdd', 'createdAt'],
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component: '@/components/admin/collections/WishlistsListView#WishlistsListView',
        },
      },
    },
  },
  hooks: {
    beforeChange: [forceOwnCustomerAndSnapshotPrice],
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: {
        update: adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
    },
    {
      name: 'variant',
      type: 'relationship',
      relationTo: 'variants',
      admin: {
        description: 'Optional — set when the customer saved a specific variant rather than the base product.',
      },
    },
    {
      name: 'priceAtAdd',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Product price (INR) when this was saved — the baseline for price-drop emails.',
      },
    },
    {
      name: 'lastNotifiedPrice',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Price at the time of the last price-drop email sent for this item, if any.',
      },
    },
    {
      name: 'stockAlertSentAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'When a back-in-stock email was last sent for this item. Cleared automatically if the product goes out of stock again, so the next restock notifies again.',
      },
    },
  ],
}
