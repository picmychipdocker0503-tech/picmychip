import type { Field } from 'payload'

import { droneMotorSpecs } from './droneMotorSpecs'
import { filamentSpecs } from './filamentSpecs'
import { mechanicalSpecs } from './mechanicalSpecs'
import { microcontrollerSpecs } from './microcontrollerSpecs'
import { sbcSpecs } from './sbcSpecs'
import { toolSpecs } from './toolSpecs'

export { SPEC_SCHEMA_OPTIONS } from './specSchemaOptions'
export type { SpecSchemaType } from './specSchemaOptions'

/**
 * One sub-group per category, each conditionally shown based on the sibling
 * `specSchemaType` field. Kept flat (group, not blocks) so facet queries in a
 * later phase can filter/sort directly on `specs.<category>.<field>`.
 */
export const productSpecsGroup: Field = {
  name: 'specs',
  type: 'group',
  label: 'Category Specs',
  fields: [droneMotorSpecs, sbcSpecs, microcontrollerSpecs, mechanicalSpecs, toolSpecs, filamentSpecs],
}
