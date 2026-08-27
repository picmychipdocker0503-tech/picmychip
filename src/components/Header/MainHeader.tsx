'use client'

import type { Header } from '@/payload-types'

import type { CategoryMenuGroup } from '@/utilities/categoryMenuGroups'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { MiniCartPopover } from '@/components/Cart/MiniCartPopover'
import { MiniWishlistPopover } from '@/components/Wishlist/MiniWishlistPopover'
import { Media } from '@/components/Media'
import { Search } from '@/components/Search'
import { NavIconBadge } from '@/components/ui/nav-icon-badge'
import { useFeatureFlags } from '@/lib/useFeatureFlags'
import { useAuth } from '@/providers/Auth'
import { useCompare } from '@/providers/Compare'
import { useWishlist } from '@/providers/Wishlist'
import { HeartIcon, LogInIcon, ReceiptTextIcon, ScaleIcon, UploadIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
  const flags = useFeatureFlags()
  const t = useTranslations('account')

  const iconButtonClass =
    'group relative hidden size-10 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] hover:bg-muted hover:text-foreground active:scale-95 md:inline-flex'
  const rfqActionClass =
    'group bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/15 inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 active:scale-95'

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
              className="font-semibold tracking-tight text-foreground"
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

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Link
              className={rfqActionClass}
              href="/rfq?upload=1"
            >
              <UploadIcon className="pmc-icon-anim size-4 group-hover:animate-[pmc-icon-nudge-up_0.5s_ease-in-out]" />
              BOM
            </Link>
            <Link
              className={rfqActionClass}
              href="/rfq#rfq-form"
            >
              <ReceiptTextIcon className="pmc-icon-anim size-4 group-hover:animate-[pmc-icon-pop_0.5s_ease-in-out]" />
              RFQ
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <Link aria-label="Favorites" className={iconButtonClass} href="/wishlist">
                <HeartIcon className="pmc-icon-anim size-5 group-hover:animate-[pmc-icon-pop_0.5s_ease-in-out]" />
                <NavIconBadge count={wishlistIds.length} />
              </Link>
              <MiniWishlistPopover />
            </div>
            {flags.compareProducts && (
              <Link
                aria-label="Compare"
                className={iconButtonClass}
                href={ids.length > 0 ? `/compare?ids=${ids.join(',')}` : '/compare'}
              >
                <ScaleIcon className="pmc-icon-anim size-5 group-hover:animate-[pmc-icon-tilt_0.5s_ease-in-out]" />
                <NavIconBadge count={ids.length} />
              </Link>
            )}
            <div className="relative ml-1 border-l border-border/70 pl-1">
              <Suspense fallback={<OpenCartButton />}>
                <Cart />
              </Suspense>
              <MiniCartPopover />
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
            {user ? (
              <Link
                className="hover:text-primary group flex items-center gap-2 font-medium transition-colors"
                href="/account"
              >
                <span className="border-border bg-primary/10 relative size-6 shrink-0 overflow-hidden rounded-full border group-hover:border-primary/40">
                  {user.avatar && typeof user.avatar === 'object' ? (
                    <Media
                      className="relative block h-full w-full"
                      fill
                      htmlElement="span"
                      imgClassName="object-cover"
                      resource={user.avatar}
                    />
                  ) : (
                    <span className="text-primary flex h-full w-full items-center justify-center text-[10px] font-bold">
                      {(user.name || user.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                Hi, {user.name || 'there'}
              </Link>
            ) : (
              <>
                <Link className="hover:text-primary transition-colors" href="/create-account">
                  {t('createAccount')}
                </Link>
                <span className="bg-border h-3 w-px" />
                <Link
                  className="group text-foreground hover:text-primary inline-flex items-center gap-1 font-medium transition-colors"
                  href="/login"
                >
                  <LogInIcon className="pmc-icon-anim size-3.5 group-hover:animate-[pmc-icon-nudge-right_0.5s_ease-in-out]" />
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
