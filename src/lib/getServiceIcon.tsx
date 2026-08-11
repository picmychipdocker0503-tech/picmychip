import { CircuitBoard, FilamentSpool } from '@/components/illustrations'
import { BatteryChargingIcon, ScissorsLineDashedIcon, WrenchIcon } from 'lucide-react'
import type { ComponentType } from 'react'

const ICON_RULES: { match: RegExp; Icon: ComponentType<{ className?: string }> }[] = [
  { match: /pcb/i, Icon: CircuitBoard },
  { match: /3d|print/i, Icon: FilamentSpool },
  { match: /laser/i, Icon: ScissorsLineDashedIcon },
  { match: /battery/i, Icon: BatteryChargingIcon },
]

/** Best-effort icon for a Service by title keyword — no dedicated icon field on the collection yet. */
export const getServiceIcon = (title: string) => ICON_RULES.find(({ match }) => match.test(title))?.Icon ?? WrenchIcon
