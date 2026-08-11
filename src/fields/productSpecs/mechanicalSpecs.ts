import type { Field } from 'payload'

import { selectWithOther } from '@/fields/selectWithOther'

export const mechanicalSpecs: Field = {
  name: 'mechanical',
  type: 'group',
  label: 'Mechanical Component Specs',
  admin: {
    condition: (data) => data?.specSchemaType === 'mechanical',
    description: 'Shown when Spec Schema is set to "Mechanical Components".',
  },
  fields: [
    ...selectWithOther({
      name: 'componentType',
      label: 'Component Type',
      options: [
        { label: 'Gear', value: 'gear' },
        { label: 'Bearing', value: 'bearing' },
        { label: 'Coupler', value: 'coupler' },
        { label: 'Frame', value: 'frame' },
        { label: 'Chassis Kit', value: 'chassis-kit' },
        { label: 'Fastener', value: 'fastener' },
      ],
    }),
    ...selectWithOther({
      name: 'material',
      label: 'Material',
      options: [
        { label: 'Aluminum', value: 'aluminum' },
        { label: 'Carbon Fiber', value: 'carbon-fiber' },
        { label: 'ABS Plastic', value: 'abs-plastic' },
        { label: 'Nylon', value: 'nylon' },
        { label: 'Steel', value: 'steel' },
        { label: 'Brass', value: 'brass' },
        { label: 'PLA', value: 'pla' },
      ],
    }),
    {
      name: 'dimensions',
      type: 'group',
      label: 'Dimensions',
      fields: [
        { name: 'lengthMM', type: 'number', label: 'Length (mm)' },
        { name: 'widthMM', type: 'number', label: 'Width (mm)' },
        { name: 'heightMM', type: 'number', label: 'Height (mm)' },
        { name: 'boreDiameterMM', type: 'number', label: 'Bore Diameter (mm)' },
      ],
    },
  ],
}
