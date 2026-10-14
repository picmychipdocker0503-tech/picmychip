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
      name: 'bulkPricing',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable bulk (quantity-break) pricing',
      admin: {
        description:
          'Master switch. Off = every product is charged its flat per-piece price and the bulk pricing table is hidden, regardless of per-product settings.',
      },
    },
    {
      name: 'bulkPricingTiers',
      type: 'array',
      labels: { singular: 'Default Price Break', plural: 'Default Price Breaks' },
      admin: {
        condition: (data) => Boolean(data?.bulkPricing),
        description:
          'Store-wide default price breaks, as a % off each product\'s own price (e.g. 10 → 5%, 100 → 12%). Applied to every product whose Bulk Pricing is "Default" and that has no Price Tiers of its own. The highest break is open-ended. Leave empty to only use per-product tiers.',
      },
      fields: [
        { name: 'minQuantity', type: 'number', label: 'Min Quantity', required: true, min: 1 },
        { name: 'discountPercent', type: 'number', label: 'Discount %', required: true, min: 0, max: 100 },
      ],
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
