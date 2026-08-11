import type { Field } from 'payload'

import { selectWithOther } from '@/fields/selectWithOther'

export const filamentSpecs: Field = {
  name: 'filament',
  type: 'group',
  label: '3D Printing Filament Specs',
  admin: {
    condition: (data) => data?.specSchemaType === 'filaments',
    description: 'Shown when Spec Schema is set to "3D Printing Filaments".',
  },
  fields: [
    ...selectWithOther({
      name: 'materialType',
      label: 'Material Type',
      options: [
        { label: 'PLA', value: 'pla' },
        { label: 'PETG', value: 'petg' },
        { label: 'ABS', value: 'abs' },
        { label: 'TPU', value: 'tpu' },
        { label: 'Nylon', value: 'nylon' },
      ],
    }),
    {
      name: 'diameterMM',
      type: 'select',
      label: 'Diameter',
      options: [
        { label: '1.75mm', value: '1.75' },
        { label: '2.85mm', value: '2.85' },
      ],
    },
    { name: 'color', type: 'text', label: 'Color' },
    {
      name: 'colorHex',
      type: 'text',
      label: 'Color (Hex)',
      admin: { description: 'Optional hex value for a future color swatch.' },
    },
    { name: 'spoolWeightG', type: 'number', label: 'Spool Weight (g)' },
    { name: 'printTempMinC', type: 'number', label: 'Print Temp Min (°C)' },
    { name: 'printTempMaxC', type: 'number', label: 'Print Temp Max (°C)' },
  ],
}
