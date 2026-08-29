import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { INDIAN_STATES } from '@/lib/indianStates'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Settings',
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
      name: 'officeAddress',
      type: 'group',
      label: 'Office Address',
      admin: {
        description: 'Public office address used in Organization structured data (Schema.org) shown to search engines.',
      },
      fields: [
        {
          name: 'streetAddress',
          type: 'text',
        },
        {
          name: 'addressLocality',
          type: 'text',
          label: 'City',
        },
        {
          name: 'addressRegion',
          type: 'select',
          label: 'State',
          options: INDIAN_STATES.map((state) => ({ label: state.name, value: state.name })),
        },
        {
          name: 'postalCode',
          type: 'text',
        },
        {
          name: 'addressCountry',
          type: 'text',
          defaultValue: 'IN',
          admin: {
            description: 'ISO 3166-1 alpha-2 country code, e.g. "IN".',
          },
        },
      ],
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
          type: 'select',
          options: INDIAN_STATES.map((state) => ({ label: state.name, value: state.name })),
          admin: {
            description:
              'Used to determine CGST+SGST (intra-state) vs IGST (inter-state) against the customer’s state, and as the seller state on Zoho invoices.',
          },
        },
        {
          name: 'businessPan',
          type: 'text',
          label: 'PAN',
          admin: {
            description: 'Company PAN, sent to Zoho Books as part of the organization profile.',
          },
        },
        {
          name: 'gstRatePercent',
          type: 'number',
          defaultValue: 18,
          admin: {
            description:
              'Default rate, added on top of the GST-exclusive listed price at checkout. Individual products can override this via their own GST % field.',
          },
        },
      ],
    },
    {
      name: 'shippingSettings',
      type: 'group',
      label: 'Shipping Charges',
      admin: {
        description: 'Flat rates charged at checkout for each dispatch option.',
      },
      fields: [
        {
          name: 'standardShippingRate',
          type: 'number',
          label: 'Standard Shipping (₹)',
          defaultValue: 200,
          min: 0,
          admin: {
            description: 'Amount in rupees, e.g. 200 for ₹200.00.',
          },
        },
        {
          name: 'expressShippingRate',
          type: 'number',
          label: 'Express Shipping (₹)',
          defaultValue: 300,
          min: 0,
          admin: {
            description: 'Amount in rupees, e.g. 300 for ₹300.00.',
          },
        },
      ],
    },
    {
      name: 'orderNumberSettings',
      type: 'group',
      label: 'Order Numbering',
      admin: {
        description:
          'Controls the customer-facing order number shown on the storefront, in emails, and in admin (e.g. "ECOM0001") — the underlying order id used internally (URLs, relations) is unaffected.',
      },
      fields: [
        {
          name: 'prefix',
          type: 'text',
          defaultValue: 'ECOM',
        },
        {
          name: 'padding',
          type: 'number',
          defaultValue: 4,
          min: 1,
          max: 10,
          admin: {
            description: 'Minimum digits, zero-padded — 4 gives ECOM0001, 5 gives ECOM00001.',
          },
        },
      ],
    },
    {
      name: 'highlightStyle',
      type: 'group',
      label: 'Product Highlights Style',
      admin: {
        description: 'Controls the look of the highlight chips shown near the top of every product page.',
      },
      fields: [
        {
          name: 'backgroundColor',
          type: 'text',
          label: 'Background Color',
          defaultValue: '#fef9c3',
          admin: {
            description: 'Hex color code, e.g. #fef9c3 for light yellow.',
          },
        },
        {
          name: 'textColor',
          type: 'text',
          label: 'Text Color',
          defaultValue: '#713f12',
          admin: {
            description: 'Hex color code, e.g. #713f12 for dark amber.',
          },
        },
        {
          name: 'bold',
          type: 'checkbox',
          label: 'Bold Text',
          defaultValue: true,
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
