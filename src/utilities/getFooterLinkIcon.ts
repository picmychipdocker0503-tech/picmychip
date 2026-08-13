import {
  Briefcase,
  BookOpen,
  Building2,
  FileText,
  HelpCircle,
  Mail,
  Newspaper,
  Package,
  Scale,
  Shield,
  Store,
  Truck,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Best-effort icon for a footer link by its label — no dedicated icon field
 * on the link group. Order matters: more specific patterns (e.g. "track an
 * order") are checked before broader ones they'd otherwise be swallowed by
 * (e.g. "order").
 */
export const getFooterLinkIcon = (label: string): LucideIcon => {
  if (/track/i.test(label)) return Truck
  if (/compare/i.test(label)) return Scale
  if (/shop|products?/i.test(label)) return Store
  if (/guide|tutorial/i.test(label)) return BookOpen
  if (/account/i.test(label)) return User
  if (/order/i.test(label)) return Package
  if (/about/i.test(label)) return Building2
  if (/faq/i.test(label)) return HelpCircle
  if (/privacy/i.test(label)) return Shield
  if (/terms|refund|policy/i.test(label)) return FileText
  if (/contact/i.test(label)) return Mail
  if (/blog/i.test(label)) return Newspaper
  if (/career/i.test(label)) return Briefcase
  return FileText
}
