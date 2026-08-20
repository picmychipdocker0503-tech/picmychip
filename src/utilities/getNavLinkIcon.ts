import {
  Briefcase,
  BookOpen,
  Building2,
  FileText,
  HelpCircle,
  Layers,
  Mail,
  Newspaper,
  Package,
  Scale,
  Shield,
  Store,
  Truck,
  User,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Best-effort icon for a nav/footer link by its label — no dedicated icon
 * field on the link group. Order matters: more specific patterns (e.g.
 * "track an order") are checked before broader ones they'd otherwise be
 * swallowed by (e.g. "order").
 */
export const getNavLinkIcon = (label: string): LucideIcon => {
  if (/track/i.test(label)) return Truck
  if (/compare/i.test(label)) return Scale
  if (/shop|products?|all categories/i.test(label)) return Store
  if (/guide|tutorial/i.test(label)) return BookOpen
  if (/account/i.test(label)) return User
  if (/order/i.test(label)) return Package
  if (/^pages$/i.test(label)) return Layers
  if (/about/i.test(label)) return Building2
  if (/faq/i.test(label)) return HelpCircle
  if (/privacy/i.test(label)) return Shield
  if (/terms|refund|policy/i.test(label)) return FileText
  if (/contact/i.test(label)) return Mail
  if (/blog/i.test(label)) return Newspaper
  if (/career/i.test(label)) return Briefcase
  if (/team/i.test(label)) return Users
  return FileText
}
