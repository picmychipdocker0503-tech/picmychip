import type { Field } from 'payload'

import { selectWithOther } from '@/fields/selectWithOther'

export const microcontrollerSpecs: Field = {
  name: 'microcontroller',
  type: 'group',
  label: 'Microcontroller / Dev Board Specs',
  admin: {
    condition: (data) => data?.specSchemaType === 'microcontrollers',
    description: 'Shown when Spec Schema is set to "Microcontrollers & Dev Boards".',
  },
  fields: [
    ...selectWithOther({
      name: 'family',
      label: 'Family',
      options: [
        'Arduino',
        'ESP32',
        'ESP8266',
        'STM32',
        'PIC',
        'Teensy',
        'RP2040',
        'nRF52',
      ].map((value) => ({ label: value, value: value.toLowerCase() })),
    }),
    { name: 'clockSpeedMHz', type: 'number', label: 'Clock Speed (MHz)' },
    { name: 'flashSize', type: 'number', label: 'Flash Size' },
    {
      name: 'flashUnit',
      type: 'select',
      label: 'Flash Unit',
      options: [
        { label: 'KB', value: 'KB' },
        { label: 'MB', value: 'MB' },
      ],
    },
    { name: 'ramSize', type: 'number', label: 'RAM Size' },
    {
      name: 'ramUnit',
      type: 'select',
      label: 'RAM Unit',
      options: [
        { label: 'KB', value: 'KB' },
        { label: 'MB', value: 'MB' },
      ],
    },
    { name: 'ioCount', type: 'number', label: 'I/O Count' },
    {
      name: 'wireless',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Wi-Fi', value: 'wifi' },
        { label: 'Bluetooth', value: 'bluetooth' },
        { label: 'BLE', value: 'ble' },
        { label: 'LoRa', value: 'lora' },
        { label: 'Zigbee', value: 'zigbee' },
        { label: 'None', value: 'none' },
      ],
    },
  ],
}
