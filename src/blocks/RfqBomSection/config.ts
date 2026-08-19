import type { Block } from 'payload'

export const RfqBomSection: Block = {
  slug: 'rfqBomSection',
  interfaceName: 'RfqBomSectionBlock',
  labels: {
    plural: 'RFQ & BOM Sourcing Sections',
    singular: 'RFQ & BOM Sourcing Section',
  },
  fields: [
    {
      name: 'badge',
      type: 'text',
      defaultValue: 'Instant Sourcing Hub',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Automate component sourcing & bulk RFQ quoting',
    },
    {
      name: 'subtitle',
      type: 'textarea',
      defaultValue:
        'Upload a BOM or enter parts manually — we auto-match each line against live inventory, check stock in real time, and roll up target pricing across your full list.',
    },
    {
      name: 'bomCard',
      type: 'group',
      label: 'Bulk BOM Upload card',
      fields: [
        { name: 'badge', type: 'text', defaultValue: 'Instant Match' },
        { name: 'title', type: 'text', required: true, defaultValue: 'Bulk BOM Upload' },
        {
          name: 'description',
          type: 'textarea',
          defaultValue:
            'Upload a spreadsheet (.xlsx, .xls, or .csv) with up to 200+ lines — MPN, quantity, and target price are auto-mapped.',
        },
      ],
    },
    {
      name: 'rfqCard',
      type: 'group',
      label: 'Quick Multi-Line RFQ card',
      fields: [
        { name: 'badge', type: 'text', defaultValue: 'Direct Entry' },
        { name: 'title', type: 'text', required: true, defaultValue: 'Quick Multi-Line RFQ' },
        {
          name: 'description',
          type: 'textarea',
          defaultValue:
            'No file handy? Enter part number, manufacturer, quantity, and target lead time directly in a multi-row grid.',
        },
      ],
    },
    {
      name: 'primaryLink',
      type: 'group',
      label: 'Primary CTA (Upload BOM)',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'url', type: 'text', required: true, defaultValue: '/rfq?upload=1', admin: { width: '50%' } },
            {
              name: 'label',
              type: 'text',
              required: true,
              defaultValue: 'Upload BOM (.xlsx / .csv)',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'secondaryLink',
      type: 'group',
      label: 'Secondary CTA (Manual RFQ Grid)',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'url', type: 'text', required: true, defaultValue: '/rfq#rfq-form', admin: { width: '50%' } },
            {
              name: 'label',
              type: 'text',
              required: true,
              defaultValue: 'Enter Manual RFQ Grid',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
  ],
}
