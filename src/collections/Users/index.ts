import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { publicAccess } from '@/access/publicAccess'
import { adminOrSelf } from '@/access/adminOrSelf'
import { checkRole } from '@/access/utilities'
import { accountActivationEmailHtml, resetPasswordEmailHtml } from '@/lib/email'
import { getServerSideURL } from '@/utilities/getURL'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: publicAccess,
    delete: adminOnly,
    read: adminOrSelf,
    unlock: adminOnly,
    update: adminOrSelf,
  },
  admin: {
    group: 'Users',
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 1209600,
    // Default verify/forgot-password emails link to the admin UI, which
    // storefront customers should never see (most aren't admins, so that
    // link would be a dead end) — point both at the frontend instead. Until
    // an email adapter is configured these are logged, not sent.
    verify: {
      generateEmailHTML: ({ token, user }) =>
        accountActivationEmailHtml({
          verificationUrl: `${getServerSideURL()}/verify-email?token=${token}`,
          name: user?.name,
        }),
      generateEmailSubject: () => 'Verify your Picmychip account',
    },
    forgotPassword: {
      generateEmailHTML: (args) =>
        resetPasswordEmailHtml({
          resetUrl: `${getServerSideURL()}/reset-password?token=${args?.token}`,
          name: args?.user?.name,
        }),
      generateEmailSubject: () => 'Reset your Picmychip password',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile picture, shown in the account area and header.',
      },
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: ['customer'],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'customer',
          value: 'customer',
        },
      ],
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
    {
      name: 'zohoCustomerId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Zoho Books contact id — checked first when matching this customer on future orders.',
      },
    },
  ],
}
