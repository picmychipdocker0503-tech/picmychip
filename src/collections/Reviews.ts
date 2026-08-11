import type { Access, CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { checkRole } from '@/access/utilities'
import { deriveVerifiedPurchase } from '@/hooks/deriveVerifiedPurchase'

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

/**
 * A non-admin's own user ID always wins for `customer`, regardless of what
 * the request body claims — prevents posting a review as someone else.
 */
const forceOwnCustomerOnCreate: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === 'create' && req.user && !checkRole(['admin'], req.user)) {
    return { ...data, customer: req.user.id }
  }

  return data
}

const readApprovedOrOwn: Access = ({ req: { user } }) => {
  if (user && checkRole(['admin'], user)) return true

  if (user?.id) {
    const where: Where = {
      or: [{ status: { equals: 'approved' } }, { customer: { equals: user.id } }],
    }
    return where
  }

  return { status: { equals: 'approved' } }
}

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  access: {
    create: isAuthenticated,
    delete: adminOnly,
    read: readApprovedOrOwn,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['product', 'rating', 'status', 'verifiedPurchase', 'createdAt'],
    useAsTitle: 'id',
  },
  hooks: {
    beforeChange: [forceOwnCustomerOnCreate, deriveVerifiedPurchase],
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: {
        update: adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'comment',
      type: 'textarea',
    },
    {
      name: 'verifiedPurchase',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-derived from order history — cannot be set manually.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      access: {
        create: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
