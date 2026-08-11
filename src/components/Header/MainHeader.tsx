'use client'

import type { Header } from '@/payload-types'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Search } from '@/components/Search'
import { NavIconBadge } from '@/components/ui/nav-icon-badge'
import { useAuth } from '@/providers/Auth'
import { useCompare } from '@/providers/Compare'
import { useLocale } from '@/providers/Locale'
import { useWishlist } from '@/providers/Wishlist'
import { HeartIcon, ScaleIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { LogoIcon } from '@/components/icons/logo'
import { MainNavigationBar } from './MainNavigationBar'
import { MobileMenu } from './MobileMenu'

type Props = {
  header: Header
}

export function MainHeader({ header }: Props) {
  const menu = header.navItems ?? []
  const { ids } = useCompare()
  const { ids: wishlistIds } = useWishlist()
  const { user } = useAuth()
  const { t } = useLocale()

  const iconButtonClass =
    'relative hidden size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex'

  return (
    <div className="border-border/70 bg-card relative z-20 border-b">
      <nav className="container flex items-center justify-between gap-6 py-4">
        {/* Logo */}
        <Link className="flex shrink-0 items-center gap-2.5" href="/">
          <LogoIcon className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold tracking-tight text-foreground">Picmychip</span>
        </Link>

        {/* Search - Desktop */}
        <div className="hidden flex-1 justify-center md:flex">
          <Suspense fallback={null}>
            <Search className="max-w-xl" />
          </Suspense>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-0.5">
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
              <MobileMenu menu={menu} />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Category Nav - Desktop */}
      <div className="border-border/70 hidden border-t md:block">
        <div className="container flex items-center justify-between py-2">
          <MainNavigationBar menu={menu} />

          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <LanguageSwitcher className="select select-ghost select-xs text-muted-foreground hover:text-primary w-auto" />
            <span className="text-border">|</span>
            {user ? (
              <Link className="hover:text-primary transition-colors" href="/account">
                Hi, {user.name || 'there'}
              </Link>
            ) : (
              <>
                <Link className="hover:text-primary transition-colors" href="/create-account">
                  {t('createAccount')}
                </Link>
                <span className="text-border">|</span>
                <Link className="hover:text-primary transition-colors" href="/login">
                  {t('signIn')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="container pb-4 md:hidden">
        <Suspense fallback={null}>
          <Search className="w-full" />
        </Suspense>
      </div>
    </div>
  )
}
