'use client'

import type { Header } from '@/payload-types'

import type { CategoryMenuGroup } from '@/utilities/categoryMenuGroups'

import { NavDropdown } from './NavDropdown'
import { ShopMegaMenu } from './ShopMegaMenu'
import { usePathname } from 'next/navigation'

type Props = {
  menu: NonNullable<Header['navItems']>
  shopCategoryGroups: CategoryMenuGroup[]
}

export function MainNavigationBar({ menu, shopCategoryGroups }: Props) {
  const pathname = usePathname()

  if (!menu.length) return null

  const isItemActive = (item: (typeof menu)[number]) => {
    if (item.link.url && item.link.url !== '/' && pathname.includes(item.link.url)) return true
    return (item.children ?? []).some((child) => child.link.url && pathname.includes(child.link.url))
  }

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {menu.map((item) =>
        item.link.label === 'All Categories' && shopCategoryGroups.length ? (
          <ShopMegaMenu
            active={isItemActive(item)}
            groups={shopCategoryGroups}
            key={item.id}
            label={item.link.label}
            url={item.link.url || '/shop'}
          />
        ) : (
          <NavDropdown active={isItemActive(item)} item={item} key={item.id} />
        ),
      )}
    </nav>
  )
}
