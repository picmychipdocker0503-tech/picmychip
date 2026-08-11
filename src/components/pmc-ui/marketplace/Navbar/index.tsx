'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'
import { Drawer } from '@/components/pmc-ui/primitives/Drawer'
import { MegaMenu, type MegaMenuColumn, type MegaMenuPromo } from '@/components/pmc-ui/marketplace/MegaMenu'
import { SearchBar, type SearchSuggestion } from '@/components/pmc-ui/marketplace/SearchBar'

export interface NavbarNavItem {
  label: string
  href: string
  megaMenu?: {
    columns: MegaMenuColumn[]
    promo?: MegaMenuPromo
  }
}

export interface NavbarProps {
  logo: React.ReactNode
  navItems: NavbarNavItem[]
  actions?: React.ReactNode
  topBar?: React.ReactNode
  searchSuggestions?: SearchSuggestion[]
  searchLoading?: boolean
  onSearchQueryChange?: (query: string) => void
  onSearchSubmit?: (query: string) => void
  className?: string
}

export function Navbar({
  logo,
  navItems,
  actions,
  topBar,
  searchSuggestions,
  searchLoading,
  onSearchQueryChange,
  onSearchSubmit,
  className,
}: NavbarProps) {
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <header className={cn('sticky top-0 z-40 border-b border-pmc-slate-200 bg-white', className)}>
      {topBar}
      <div className="mx-auto flex max-w-[86rem] items-center gap-4 px-4 py-3 sm:px-6">
        <div className="shrink-0">{logo}</div>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li
                key={item.href}
                className="relative"
                onMouseEnter={() => item.megaMenu && setOpenMenu(item.label)}
                onMouseLeave={() => item.megaMenu && setOpenMenu(null)}
              >
                <a
                  href={item.href}
                  aria-haspopup={item.megaMenu ? 'true' : undefined}
                  aria-expanded={item.megaMenu ? openMenu === item.label : undefined}
                  onFocus={() => item.megaMenu && setOpenMenu(item.label)}
                  className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-pmc-ink-700 hover:bg-pmc-slate-100 hover:text-pmc-blue-700 focus-visible:outline-none focus-visible:shadow-pmc-focus"
                >
                  {item.label}
                </a>
                {item.megaMenu && (
                  <MegaMenu
                    open={openMenu === item.label}
                    columns={item.megaMenu.columns}
                    promo={item.megaMenu.promo}
                  />
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden flex-1 md:block">
          <SearchBar
            suggestions={searchSuggestions}
            loading={searchLoading}
            onQueryChange={onSearchQueryChange}
            onSubmit={onSearchSubmit}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="inline-flex size-10 items-center justify-center rounded-md text-pmc-ink-700 hover:bg-pmc-slate-100 lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="border-t border-pmc-slate-100 px-4 py-2 md:hidden">
        <SearchBar
          suggestions={searchSuggestions}
          loading={searchLoading}
          onQueryChange={onSearchQueryChange}
          onSubmit={onSearchSubmit}
        />
      </div>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} side="left" title="Menu">
        <nav aria-label="Mobile primary">
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.href} className="border-b border-pmc-slate-100 last:border-none">
                <a
                  href={item.href}
                  className="block px-1 py-3 text-sm font-medium text-pmc-ink-800"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
                {item.megaMenu && (
                  <ul className="mb-2 flex flex-col gap-1 pl-3">
                    {item.megaMenu.columns.flatMap((c) => c.links).map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className="block py-1.5 text-sm text-pmc-ink-500">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </header>
  )
}
