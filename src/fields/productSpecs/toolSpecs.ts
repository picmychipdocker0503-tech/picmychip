import type { Field } from 'payload'

import { selectWithOther } from '@/fields/selectWithOther'

export const toolSpecs: Field = {
  name: 'tool',
  type: 'group',
  label: 'Workbench Tool Specs',
  admin: {
    condition: (data) => data?.specSchemaType === 'tools',
    description: 'Shown when Spec Schema is set to "Workbench Tools".',
  },
  fields: [
    {
      name: 'toolType',
      type: 'select',
      options: [
        { label: 'Soldering Station', value: 'soldering-station' },
        { label: 'Multimeter', value: 'multimeter' },
        { label: 'Oscilloscope', value: 'oscilloscope' },
        { label: 'Hot Air Rework Station', value: 'hot-air-rework' },
        { label: 'Hand Tool', value: 'hand-tool' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'powerWattage', type: 'number', label: 'Power (W)' },
    {
      name: 'voltageSpec',
      type: 'text',
      label: 'Voltage Spec',
      admin: { description: 'Free text, e.g. "110-240V AC" — voltage notation varies too much for a clean enum.' },
    },
    {
      name: 'measurementRanges',
      type: 'array',
      label: 'Measurement Ranges',
      admin: {
        description:
          'Generic, repeatable parameter/min/max/unit rows — mirrors how datasheets tabulate ranges and works the same across every tool type (multimeter, oscilloscope, iron, etc).',
      },
      fields: [
        ...selectWithOther({
          name: 'parameter',
          label: 'Parameter',
          enumName: 'tool_measurement_range_parameter',
          options: [
            { label: 'Temperature', value: 'temperature' },
            { label: 'Voltage (DC)', value: 'voltage-dc' },
            { label: 'Voltage (AC)', value: 'voltage-ac' },
            { label: 'Current', value: 'current' },
            { label: 'Resistance', value: 'resistance' },
            { label: 'Bandwidth', value: 'bandwidth' },
            { label: 'Sample Rate', value: 'sample-rate' },
            { label: 'Airflow', value: 'airflow' },
          ],
        }),
        { name: 'minValue', type: 'number', label: 'Min' },
        { name: 'maxValue', type: 'number', label: 'Max' },
        ...selectWithOther({
          name: 'unit',
          label: 'Unit',
          options: ['°C', 'V', 'A', 'Ω', 'MHz', 'MS/s', 'L/min'],
        }),
      ],
    },
  ],
}
