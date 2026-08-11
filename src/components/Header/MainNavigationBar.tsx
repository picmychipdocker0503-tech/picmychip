'use client'

import type { Header } from '@/payload-types'

import { NavDropdown } from './NavDropdown'
import { usePathname } from 'next/navigation'

type Props = {
  menu: NonNullable<Header['navItems']>
}

export function MainNavigationBar({ menu }: Props) {
  const pathname = usePathname()

  if (!menu.length) return null

  const isItemActive = (item: (typeof menu)[number]) => {
    if (item.link.url && item.link.url !== '/' && pathname.includes(item.link.url)) return true
    return (item.children ?? []).some((child) => child.link.url && pathname.includes(child.link.url))
  }

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {menu.map((item) => (
        <NavDropdown active={isItemActive(item)} item={item} key={item.id} />
      ))}
    </nav>
  )
}
