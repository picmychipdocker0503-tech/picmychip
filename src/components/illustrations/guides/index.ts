import type { ComponentType } from 'react'

import { CapacitorTypes } from './CapacitorTypes'
import { ConnectorSelection } from './ConnectorSelection'
import { DiodeBasics } from './DiodeBasics'
import { Inductors } from './Inductors'
import { ResistorColorCode } from './ResistorColorCode'

/**
 * Full-color cover illustrations for specific guide posts, keyed by the
 * Guides collection `slug`. Distinct from `../categoryIcons`, which are
 * generic single-color category icons used as a fallback when a guide has
 * neither a dedicated illustration nor an uploaded cover image.
 */
export const GUIDE_ILLUSTRATION_MAP: Record<string, ComponentType<{ className?: string }>> = {
  'capacitor-types-explained': CapacitorTypes,
  'connector-selection-guide': ConnectorSelection,
  'diode-basics-polarity-and-types': DiodeBasics,
  'inductors-101': Inductors,
  'resistor-color-code-guide': ResistorColorCode,
}

export const getGuideIllustration = (slug: string | null | undefined) =>
  (slug && GUIDE_ILLUSTRATION_MAP[slug]) || undefined
