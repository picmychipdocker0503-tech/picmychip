import type { Block } from 'payload'

export const ServicesShowcase: Block = {
  slug: 'servicesShowcase',
  interfaceName: 'ServicesShowcaseBlock',
  labels: {
    plural: 'Services Showcases',
    singular: 'Services Showcase',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Build-to-Order Services',
    },
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      required: true,
    },
  ],
}
