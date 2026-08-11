import type { Field } from 'payload'

import { selectWithOther } from '@/fields/selectWithOther'

export const sbcSpecs: Field = {
  name: 'sbc',
  type: 'group',
  label: 'Single-Board Computer Specs',
  admin: {
    condition: (data) => data?.specSchemaType === 'sbc',
    description: 'Shown when Spec Schema is set to "Single-Board Computers".',
  },
  fields: [
    ...selectWithOther({
      name: 'modelFamily',
      label: 'Model Family',
      options: [
        { label: 'Raspberry Pi Zero', value: 'raspberry-pi-zero' },
        { label: 'Raspberry Pi 3', value: 'raspberry-pi-3' },
        { label: 'Raspberry Pi 4', value: 'raspberry-pi-4' },
        { label: 'Raspberry Pi 5', value: 'raspberry-pi-5' },
        { label: 'Raspberry Pi Compute Module', value: 'raspberry-pi-cm' },
      ],
    }),
    ...selectWithOther({
      name: 'formFactor',
      label: 'Form Factor',
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Zero', value: 'zero' },
        { label: 'Compute Module', value: 'compute-module' },
      ],
    }),
    {
      name: 'ramMB',
      type: 'select',
      label: 'RAM',
      options: [
        { label: '512 MB', value: '512' },
        { label: '1 GB', value: '1024' },
        { label: '2 GB', value: '2048' },
        { label: '4 GB', value: '4096' },
        { label: '8 GB', value: '8192' },
        { label: '16 GB', value: '16384' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'ramCustomMB',
      type: 'number',
      label: 'Custom RAM (MB)',
      admin: {
        condition: (_, siblingData) => siblingData?.ramMB === 'custom',
      },
    },
    {
      name: 'connectivity',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Wi-Fi', value: 'wifi' },
        { label: 'Bluetooth', value: 'bluetooth' },
        { label: 'Ethernet', value: 'ethernet' },
        { label: 'USB-C', value: 'usb-c' },
        { label: 'USB-A', value: 'usb-a' },
      ],
    },
    { name: 'gpioPinCount', type: 'number', label: 'GPIO Pin Count' },
    { name: 'gpioLayoutNotes', type: 'text', label: 'GPIO Layout Notes' },
  ],
}
