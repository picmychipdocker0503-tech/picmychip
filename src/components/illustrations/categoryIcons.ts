import type { ComponentType } from 'react'

import { Cable } from './Cable'
import { Capacitor } from './Capacitor'
import { Chip } from './Chip'
import { CircuitBoard } from './CircuitBoard'
import { Connector } from './Connector'
import { Diode } from './Diode'
import { Drone } from './Drone'
import { Inductor } from './Inductor'
import { Resistor } from './Resistor'

/**
 * Icon lookup for the real imported product catalog, keyed by Category slug.
 * Kept separate from `ILLUSTRATION_MAP` in `./index.ts`, which is keyed by
 * `specSchemaType` and drives the unrelated maker-store demo spec system.
 */
export const CATEGORY_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  resistor: Resistor,
  connectors: Connector,
  'db-connectors': Connector,
  'jst-connectors': Connector,
  'drone-parts': Drone,
  capacitor: Capacitor,
  diode: Diode,
  transistor: Diode,
  'usb-cables': Cable,
  'ffc-cables': Cable,
  'jst-cables': Cable,
  cables: Cable,
  inductor: Inductor,
  ic: Chip,
  modules: Chip,
}

/**
 * Same lookup, with a generic circuit-board fallback for guides/content that
 * aren't tied to a category (or reference one with no dedicated icon yet).
 */
export const getCategoryIcon = (slug: string | null | undefined): ComponentType<{ className?: string }> =>
  (slug && CATEGORY_ICON_MAP[slug]) || CircuitBoard
