import type { SpecSchemaType } from '@/fields/productSpecs/specSchemaOptions'

export type FacetDef = {
  /** Meilisearch attribute path, e.g. "specs.droneMotor.kvRating". */
  attribute: string
  label: string
  type: 'range' | 'select'
}

/**
 * Drives both the Meilisearch index's filterable/sortable attributes and the
 * facet sidebar UI. Only scalar/enum spec fields are faceted — array-shaped
 * fields like thrustCurve are intentionally left out (same call as Phase 2's
 * simple spec table).
 */
export const FACET_CONFIG: Partial<Record<SpecSchemaType, FacetDef[]>> = {
  'drone-motors': [
    { attribute: 'specs.droneMotor.motorType', label: 'Motor Type', type: 'select' },
    { attribute: 'specs.droneMotor.kvRating', label: 'KV Rating', type: 'range' },
    { attribute: 'specs.droneMotor.applications', label: 'Applications', type: 'select' },
  ],
  sbc: [
    { attribute: 'specs.sbc.modelFamily', label: 'Model Family', type: 'select' },
    { attribute: 'specs.sbc.ramMB', label: 'RAM', type: 'select' },
    { attribute: 'specs.sbc.connectivity', label: 'Connectivity', type: 'select' },
  ],
  microcontrollers: [
    { attribute: 'specs.microcontroller.family', label: 'Family', type: 'select' },
    { attribute: 'specs.microcontroller.clockSpeedMHz', label: 'Clock Speed (MHz)', type: 'range' },
    { attribute: 'specs.microcontroller.wireless', label: 'Wireless', type: 'select' },
  ],
  mechanical: [
    { attribute: 'specs.mechanical.componentType', label: 'Component Type', type: 'select' },
    { attribute: 'specs.mechanical.material', label: 'Material', type: 'select' },
  ],
  tools: [{ attribute: 'specs.tool.toolType', label: 'Tool Type', type: 'select' }],
  filaments: [
    { attribute: 'specs.filament.materialType', label: 'Material Type', type: 'select' },
    { attribute: 'specs.filament.diameterMM', label: 'Diameter', type: 'select' },
    { attribute: 'specs.filament.printTempMinC', label: 'Print Temp Min (°C)', type: 'range' },
    { attribute: 'specs.filament.printTempMaxC', label: 'Print Temp Max (°C)', type: 'range' },
  ],
}

export const getFacetsForSchema = (specSchemaType: string | null | undefined): FacetDef[] =>
  FACET_CONFIG[specSchemaType as SpecSchemaType] ?? []

export const ALL_FACET_ATTRIBUTES = Object.values(FACET_CONFIG).flatMap((facets) =>
  (facets ?? []).map((facet) => facet.attribute),
)
