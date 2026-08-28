'use client'

import type { Header } from '@/payload-types'

import type { CategoryMenuGroup } from '@/utilities/categoryMenuGroups'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { MiniCartPopover } from '@/components/Cart/MiniCartPopover'
import { Search } from '@/components/Search'
import { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'

type Props = {
  menu: NonNullable<Header['navItems']>
  shopCategoryGroups: CategoryMenuGroup[]
}

/**
 * The storefront's mobile top bar — a single compact row (menu, search,
 * cart) instead of desktop's logo + full nav + search + icon cluster.
 * Wishlist and account are covered by MobileTabBar below, so they're not
 * duplicated up here.
 *
 * Rendered alongside MainHeader's desktop markup, gated by `md:hidden` /
 * `md:flex` on each side rather than swapped in via JS — both render in the
 * HTML, so there's no hydration flicker and no device detection.
 */
export function MobileHeader({ menu, shopCategoryGroups }: Props) {
  return (
    <div className="container flex items-center gap-2 py-3 md:hidden">
      <Suspense fallback={null}>
        <MobileMenu menu={menu} shopCategoryGroups={shopCategoryGroups} />
      </Suspense>

      <Suspense fallback={null}>
        <Search className="flex-1" />
      </Suspense>

      <div className="relative shrink-0">
        <Suspense fallback={<OpenCartButton />}>
          <Cart />
        </Suspense>
        <MiniCartPopover />
      </div>
    </div>
  )
}
