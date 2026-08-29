import { ClipboardCheckIcon, PackageSearchIcon, ShieldCheckIcon, TruckIcon, WrenchIcon } from 'lucide-react'
import type { ComponentType } from 'react'

const ICON_RULES: { match: RegExp; Icon: ComponentType<{ className?: string }> }[] = [
  { match: /sourcing|matching/i, Icon: PackageSearchIcon },
  { match: /rfq|bom|quote/i, Icon: ClipboardCheckIcon },
  { match: /dispatch|shipping|delivery/i, Icon: TruckIcon },
  { match: /verified|spec/i, Icon: ShieldCheckIcon },
]

/** Best-effort icon for a Service by title keyword — no dedicated icon field on the collection yet. */
export const getServiceIcon = (title: string) => ICON_RULES.find(({ match }) => match.test(title))?.Icon ?? WrenchIcon
