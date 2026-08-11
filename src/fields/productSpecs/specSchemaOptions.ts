export const SPEC_SCHEMA_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Drone Motors', value: 'drone-motors' },
  { label: 'Single-Board Computers', value: 'sbc' },
  { label: 'Microcontrollers & Dev Boards', value: 'microcontrollers' },
  { label: 'Mechanical Components', value: 'mechanical' },
  { label: 'Workbench Tools', value: 'tools' },
  { label: '3D Printing Filaments', value: 'filaments' },
] as const

export type SpecSchemaType = (typeof SPEC_SCHEMA_OPTIONS)[number]['value']
