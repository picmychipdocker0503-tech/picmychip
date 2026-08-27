import type { ComponentType } from 'react'

import type { SpecSchemaType } from '@/fields/productSpecs/specSchemaOptions'

import { BrokenCircuit } from './BrokenCircuit'
import { Cable } from './Cable'
import { Capacitor } from './Capacitor'
import { Chip } from './Chip'
import { CircuitBoard } from './CircuitBoard'
import { CommunityVoice } from './CommunityVoice'
import { Connector } from './Connector'
import { Diode } from './Diode'
import { Drone } from './Drone'
import { EmptyState } from './EmptyState'
import { FilamentSpool } from './FilamentSpool'
import { Gear } from './Gear'
import { Inductor } from './Inductor'
import { Microcontroller } from './Microcontroller'
import { Newsletter } from './Newsletter'
import { OpenRoles } from './OpenRoles'
import { QualityCheck } from './QualityCheck'
import { Resistor } from './Resistor'
import { ShippingBox } from './ShippingBox'
import { ShopBag } from './ShopBag'
import { Team } from './Team'
import { Toolbox } from './Toolbox'
import { Warning } from './Warning'

export {
  BrokenCircuit,
  Cable,
  Capacitor,
  Chip,
  CircuitBoard,
  CommunityVoice,
  Connector,
  Diode,
  Drone,
  EmptyState,
  FilamentSpool,
  Gear,
  Inductor,
  Microcontroller,
  Newsletter,
  OpenRoles,
  QualityCheck,
  Resistor,
  ShippingBox,
  ShopBag,
  Team,
  Toolbox,
  Warning,
}

export type IllustrationKey = SpecSchemaType | 'workshop'

/**
 * Maps a Category/Product `specSchemaType` (or the generic hero `workshop`
 * option) to its themeable line-art icon. `'none'` and unknown keys fall
 * back to a generic empty-state icon.
 */
export const ILLUSTRATION_MAP: Record<IllustrationKey, ComponentType<{ className?: string }>> = {
  none: EmptyState,
  workshop: CircuitBoard,
  'drone-motors': Drone,
  sbc: CircuitBoard,
  microcontrollers: Microcontroller,
  mechanical: Gear,
  tools: Toolbox,
  filaments: FilamentSpool,
}

export const getIllustration = (key: string | null | undefined) =>
  ILLUSTRATION_MAP[(key as IllustrationKey) ?? 'none'] ?? EmptyState
