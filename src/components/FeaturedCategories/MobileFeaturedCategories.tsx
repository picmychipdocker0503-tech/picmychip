import type { Category } from '@/payload-types'

import { EmptyState } from '@/components/illustrations'
import { CATEGORY_ICON_MAP } from '@/components/illustrations/categoryIcons'
import Link from 'next/link'

import { CATEGORY_ACCENTS, DEFAULT_ACCENT } from './categoryAccents'

type Props = {
  categories: Category[]
}

/**
 * Mobile's own "Shop by Category" grid — a plain icon-over-label tile
 * (no card border/backdrop-blur/hover-lift, none of which mean anything on
 * a touch device) instead of the desktop grid's bordered cards shrunk down.
 */
export function MobileFeaturedCategories({ categories }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 md:hidden">
      {categories.map((category) => {
        const Icon = CATEGORY_ICON_MAP[category.slug] ?? EmptyState
        const accent = CATEGORY_ACCENTS[category.slug] ?? DEFAULT_ACCENT

        return (
          <Link
            className="flex flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center"
            href={`/category/${category.slug}`}
            key={category.id}
          >
            <div
              className={`flex size-14 shrink-0 items-center justify-center rounded-full border ${accent.icon} ${accent.bg} ${accent.border}`}
            >
              <Icon className="size-6" />
            </div>
            <span className="text-foreground block text-xs font-semibold">{category.title}</span>
          </Link>
        )
      })}
    </div>
  )
}
