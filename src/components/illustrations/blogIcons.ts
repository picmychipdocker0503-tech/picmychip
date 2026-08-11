import type { ComponentType } from 'react'

import { CircuitBoard } from './CircuitBoard'
import { QualityCheck } from './QualityCheck'
import { ShippingBox } from './ShippingBox'
import { Team } from './Team'
import { Warning } from './Warning'

/**
 * Blog posts don't have a product category to hang an icon off (unlike
 * technical guides, see `categoryIcons.ts`), so each post's illustration is
 * curated by slug instead — picked to match what the post is actually
 * about rather than a generic circuit-board default.
 */
export const BLOG_POST_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  'how-we-source-and-vet-components': ShippingBox,
  'inside-our-qc-process': QualityCheck,
  'life-on-the-Picmychip-team': Team,
  'mistakes-first-time-makers-make': Warning,
}

export const getBlogPostIcon = (slug: string | null | undefined): ComponentType<{ className?: string }> =>
  (slug && BLOG_POST_ICON_MAP[slug]) || CircuitBoard
