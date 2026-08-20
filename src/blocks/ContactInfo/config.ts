import type { Block } from 'payload'

export const ContactInfo: Block = {
  slug: 'contactInfo',
  interfaceName: 'ContactInfoBlock',
  labels: {
    plural: 'Contact Info Sections',
    singular: 'Contact Info Section',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Visit or call us',
    },
    {
      name: 'address',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'Used to look up the pin on the embedded Google Map when "Map search query" below is left empty.',
      },
    },
    {
      name: 'mapQuery',
      type: 'text',
      label: 'Map search query',
      admin: {
        description:
          'Overrides what\'s searched for on the map. Use this when the plain address matches several nearby businesses (e.g. a shared building) — include the business name, like "Picmychip, F-86, ...", to pin the exact listing.',
      },
    },
    {
      name: 'phones',
      type: 'textarea',
      required: true,
      admin: {
        description: 'One phone number per line.',
      },
    },
  ],
}
