'use client'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/cn'
import { getNavLinkIcon } from '@/utilities/getNavLinkIcon'
import { ChevronDownIcon } from 'lucide-react'

type NavItem = NonNullable<Header['navItems']>[number]

const linkClass =
  'flex items-center gap-1 whitespace-nowrap rounded-field px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary'

type Props = {
  active: boolean
  item: NavItem
}

export function NavDropdown({ item, active }: Props) {
  const children = item.children ?? []
  const Icon = getNavLinkIcon(item.link.label ?? '')

  if (!children.length) {
    return (
      <CMSLink
        {...item.link}
        appearance="inline"
        className={cn(linkClass, active && 'bg-primary/5 text-primary')}
        label={undefined}
        size="clear"
      >
        <Icon className="size-3.5" />
        {item.link.label}
      </CMSLink>
    )
  }

  return (
    <div className="dropdown dropdown-hover">
      <div className={cn(linkClass, 'cursor-pointer', active && 'bg-primary/5 text-primary')} role="button" tabIndex={0}>
        <Icon className="size-3.5" />
        {item.link.label}
        <ChevronDownIcon className="size-3.5" />
      </div>
      <ul
        className="dropdown-content menu z-30 mt-1 w-56 rounded-box border border-border bg-popover p-2 shadow-lg"
        tabIndex={0}
      >
        {children.map((child) => {
          const ChildIcon = getNavLinkIcon(child.link.label ?? '')

          return (
            <li key={child.id}>
              <CMSLink
                {...child.link}
                appearance="inline"
                className="flex items-center gap-2 rounded-field px-3 py-2 text-sm text-popover-foreground hover:bg-primary/5 hover:text-primary"
                label={undefined}
              >
                <ChildIcon className="text-primary/60 size-3.5 shrink-0" />
                {child.link.label}
              </CMSLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
