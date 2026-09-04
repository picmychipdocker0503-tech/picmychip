import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const FeatureFlags: GlobalConfig = {
  slug: 'feature-flags',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Settings',
    description: 'Toggle storefront features on/off without a deploy.',
  },
  hooks: {
    afterChange: [revalidateGlobal('feature-flags')],
  },
  fields: [
    {
      name: 'cashOnDelivery',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable Cash on Delivery at checkout',
    },
    {
      name: 'giftCards',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable gift card purchase & redemption',
    },
    {
      name: 'coupons',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable coupon code redemption',
    },
    {
      name: 'backInStockAlerts',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable "Notify me" for out-of-stock products',
    },
    {
      name: 'recentlyViewed',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show "Recently viewed" products',
    },
    {
      name: 'searchAutocomplete',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable live search suggestions',
    },
    {
      name: 'trackOrder',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show "Track order" link in the top utility bar',
    },
    {
      name: 'trustedByBrands',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show the "Trusted by brands worldwide" strip on the homepage',
    },
    {
      name: 'compareProducts',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable the product comparison feature (Compare icon, buttons, and bar)',
    },
    {
      name: 'rewardsProgram',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show the Rewards / loyalty points bar on the account page',
    },
    {
      name: 'freeShippingBanner',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show the free-shipping progress banner in the cart drawer',
    },
    {
      name: 'productCompare',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable product comparison (header icon, "Add to compare" buttons, compare bar)',
    },
    {
      name: 'zohoPayments',
      type: 'checkbox',
      admin: {
        description:
          'Off until ZOHO_PAYMENTS_ACCOUNT_ID/API_KEY/CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN are set in the environment — turning this on before then just shows customers a payment option that will fail to initiate.',
      },
      defaultValue: false,
      label: 'Enable Zoho Payments at checkout',
    },
  ],
}
