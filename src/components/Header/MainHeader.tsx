'use client'

import type { Header } from '@/payload-types'

import type { CategoryMenuGroup } from '@/utilities/categoryMenuGroups'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Search } from '@/components/Search'
import { NavIconBadge } from '@/components/ui/nav-icon-badge'
import { useAuth } from '@/providers/Auth'
import { useCompare } from '@/providers/Compare'
import { useTranslations } from 'next-intl'
import { useWishlist } from '@/providers/Wishlist'
import { HeartIcon, LogInIcon, ScaleIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { Wordmark } from '@/components/icons/Wordmark'
import { MainNavigationBar } from './MainNavigationBar'
import { MobileMenu } from './MobileMenu'

type Props = {
  header: Header
  shopCategoryGroups: CategoryMenuGroup[]
}

export function MainHeader({ header, shopCategoryGroups }: Props) {
  const menu = header.navItems ?? []
  const { ids } = useCompare()
  const { ids: wishlistIds } = useWishlist()
  const { user } = useAuth()
  const t = useTranslations('account')

  const iconButtonClass =
    'relative hidden size-10 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] hover:bg-muted hover:text-foreground active:scale-95 md:inline-flex'

  return (
    <>
      {/*
        This row alone is sticky (not the category strip below it) — and it's
        a top-level element here, not nested inside another wrapper, so its
        containing block is the page itself and it stays pinned for the
        whole scroll rather than un-sticking as soon as a short parent box
        scrolls past. Once the announcement bar above scrolls out of view,
        this bar simply continues from y:0, effectively taking over that
        strip's position instead of stacking a second fixed bar underneath it.
      */}
      <nav className="border-border/70 bg-card sticky top-0 z-40 border-b">
        <div className="container flex items-center justify-between gap-6 py-4">
          {/* Logo */}
          <Link className="flex shrink-0 items-center" href="/">
            <Wordmark
              className="text-xl font-semibold tracking-tight text-foreground"
              iconClassName="text-primary"
              iconSize={32}
            />
          </Link>

          {/* Search - Desktop */}
          <div className="hidden flex-1 md:flex">
            <Suspense fallback={null}>
              <Search className="w-full" />
            </Suspense>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-1">
            <Link aria-label="Account" className={iconButtonClass} href="/account">
              <UserIcon className="size-5" />
            </Link>
            <Link aria-label="Favorites" className={iconButtonClass} href="/wishlist">
              <HeartIcon className="size-5" />
              <NavIconBadge count={wishlistIds.length} />
            </Link>
            <Link aria-label="Compare" className={iconButtonClass} href="/compare">
              <ScaleIcon className="size-5" />
              <NavIconBadge count={ids.length} />
            </Link>
            <div className="ml-1 border-l border-border/70 pl-1">
              <Suspense fallback={<OpenCartButton />}>
                <Cart />
              </Suspense>
            </div>
            <div className="md:hidden">
              <Suspense fallback={null}>
                <MobileMenu menu={menu} shopCategoryGroups={shopCategoryGroups} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="container pb-4 md:hidden">
          <Suspense fallback={null}>
            <Search className="w-full" />
          </Suspense>
        </div>
      </nav>

      {/* Category Nav - Desktop */}
      <div className="border-border/70 bg-card relative z-20 hidden border-b md:block">
        <div className="container flex items-center justify-between py-2">
          <MainNavigationBar menu={menu} shopCategoryGroups={shopCategoryGroups} />

          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <LanguageSwitcher className="select select-ghost select-xs text-muted-foreground hover:text-primary w-auto" />
            <span className="bg-border h-3 w-px" />
            {user ? (
              <Link className="hover:text-primary font-medium transition-colors" href="/account">
                Hi, {user.name || 'there'}
              </Link>
            ) : (
              <>
                <Link className="hover:text-primary transition-colors" href="/create-account">
                  {t('createAccount')}
                </Link>
                <span className="bg-border h-3 w-px" />
                <Link
                  className="text-foreground hover:text-primary inline-flex items-center gap-1 font-medium transition-colors"
                  href="/login"
                >
                  <LogInIcon className="size-3.5" />
                  {t('signIn')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
