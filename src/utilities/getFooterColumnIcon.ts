import { Compass, Headset, Info, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Best-effort icon for a footer column by its heading — no dedicated icon field on the collection. */
export const getFooterColumnIcon = (title: string): LucideIcon => {
  if (/account/i.test(title)) return User
  if (/support/i.test(title)) return Headset
  if (/quick links?/i.test(title)) return Compass
  return Info
}
