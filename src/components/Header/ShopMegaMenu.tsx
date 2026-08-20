'use client'

import type { CategoryMenuGroup } from '@/utilities/categoryMenuGroups'
import type { CategoryTreeNode } from '@/utilities/getCategoryTree'

import { cn } from '@/utilities/cn'
import { getNavLinkIcon } from '@/utilities/getNavLinkIcon'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const linkClass =
  'flex items-center gap-1 whitespace-nowrap rounded-field px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary'

type Props = {
  active: boolean
  groups: CategoryMenuGroup[]
  label: string
  url: string
}

export function ShopMegaMenu({ active, groups, label, url }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const Icon = getNavLinkIcon(label)

  const allCategories = groups.flatMap((group) => group.categories)

  if (!allCategories.length) {
    return (
      <Link className={cn(linkClass, active && 'bg-primary/5 text-primary')} href={url}>
        <Icon className="size-3.5" />
        {label}
      </Link>
    )
  }

  const hovered = allCategories.find((category) => category.id === hoveredId) ?? allCategories[0]

  return (
    <div className="dropdown dropdown-hover" onMouseLeave={() => setHoveredId(null)}>
      <Link
        className={cn(linkClass, 'cursor-pointer', active && 'bg-primary/5 text-primary')}
        href={url}
        role="button"
        tabIndex={0}
      >
        <Icon className="size-3.5" />
        {label}
        <ChevronDownIcon className="size-3.5" />
      </Link>
      {/*
        No Tailwind `flex`/display utility on this element itself — daisyUI's
        own .dropdown-content rule needs sole control of `display` (it toggles
        none/flex based on hover/focus, in the same layer at higher
        specificity). A Tailwind *utility* class here sits in a
        higher-priority CSS layer than daisyUI's component layer and wins
        outright, permanently overriding `display:none` — that leaves an
        invisible-but-interactive panel sitting over the page below the
        header (still hoverable/clickable) even while "closed", which is what
        made this menu appear to pop open when hovering unrelated parts of
        the page. The flex layout lives on the inner wrapper instead, which
        only ever renders while the parent is actually shown.
      */}
      <div className="dropdown-content border-border bg-popover z-30 mt-1 rounded-box border shadow-lg" tabIndex={0}>
        <div className="flex max-h-[70vh] overflow-hidden">
          <div className="border-border w-64 overflow-y-auto border-r p-2">
            {groups.map((group, index) => (
              <div
                className={cn('pb-2', index > 0 && 'border-border mt-2 border-t pt-3')}
                key={group.heading}
              >
                <div className="text-muted-foreground/75 px-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase">
                  {group.heading}
                </div>
                <ul className="menu p-0">
                  {group.categories.map((category) => (
                    <CategoryRow
                      category={category}
                      hovered={hovered.id === category.id}
                      key={category.id}
                      onHover={() => setHoveredId(category.id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {hovered.children.length > 0 && (
            <ul className="menu w-56 p-2">
              {hovered.children.map((child) => (
                <li key={child.id}>
                  <Link
                    className="rounded-field text-popover-foreground hover:bg-muted hover:text-primary px-3 py-2 text-sm"
                    href={`/category/${child.slug}`}
                  >
                    {child.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryRow({
  category,
  hovered,
  onHover,
}: {
  category: CategoryTreeNode
  hovered: boolean
  onHover: () => void
}) {
  return (
    <li onMouseEnter={onHover}>
      <Link
        className={cn(
          'flex items-center justify-between rounded-field px-3 py-2 text-sm font-medium',
          hovered ? 'bg-primary/5 text-primary' : 'text-popover-foreground hover:bg-muted',
        )}
        href={`/category/${category.slug}`}
      >
        {category.title}
        {category.children.length > 0 && <ChevronRightIcon className="size-3.5" />}
      </Link>
    </li>
  )
}
