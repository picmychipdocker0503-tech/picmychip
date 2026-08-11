import type { Field } from 'payload'

export const droneMotorSpecs: Field = {
  name: 'droneMotor',
  type: 'group',
  label: 'Drone Motor Specs',
  admin: {
    condition: (data) => data?.specSchemaType === 'drone-motors',
    description: 'Shown when Spec Schema is set to "Drone Motors".',
  },
  fields: [
    {
      name: 'motorType',
      type: 'select',
      options: [
        { label: 'Brushless', value: 'brushless' },
        { label: 'Brushed', value: 'brushed' },
      ],
    },
    {
      name: 'kvRating',
      type: 'number',
      label: 'KV Rating',
      admin: { description: 'Motor KV rating (RPM per volt).' },
    },
    { name: 'statorWidthMM', type: 'number', label: 'Stator Width (mm)' },
    { name: 'statorHeightMM', type: 'number', label: 'Stator Height (mm)' },
    { name: 'weightG', type: 'number', label: 'Weight (g)' },
    {
      name: 'thrustCurve',
      type: 'array',
      label: 'Thrust Curve',
      admin: {
        description: 'Structured throttle → thrust data points (keeps thrust data queryable/sortable).',
      },
      fields: [
        { name: 'throttlePercent', type: 'number', required: true, min: 0, max: 100 },
        { name: 'thrustGramForce', type: 'number', required: true, min: 0 },
        { name: 'propModel', type: 'text' },
      ],
    },
    {
      name: 'applications',
      type: 'select',
      label: 'Applications',
      hasMany: true,
      options: [
        { label: 'Racing', value: 'racing' },
        { label: 'Freestyle', value: 'freestyle' },
        { label: 'Cinematic', value: 'cinematic' },
        { label: 'Industrial / Agriculture', value: 'industrial-agriculture' },
      ],
    },
  ],
}
