'use client'

import { NavIconBadge } from '@/components/ui/nav-icon-badge'
import { ensureFeaturebaseBooted } from '@/lib/featurebase'
import { useAuth } from '@/providers/Auth'
import { useWishlist } from '@/providers/Wishlist'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useFeaturebase } from 'featurebase-js/react'
import { HeartIcon, HomeIcon, MessageCircleIcon, ShoppingBagIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useMemo } from 'react'

/**
 * Persistent mobile-only bottom navigation, matching the reference app-style
 * mockup. Hidden on PDP (/products/[slug]) and /cart — those pages get their
 * own sticky action bar instead (buy bar / checkout bar), and showing both
 * at once would stack two fixed bottom bars.
 */
export const MobileTabBar: React.FC = () => {
  const pathname = usePathname()
  const { user } = useAuth()
  const { ids: wishlistIds } = useWishlist()
  const { cart } = useCart()
  const { show: showChat } = useFeaturebase()

  const cartQuantity = useMemo(
    () => cart?.items?.reduce((quantity, item) => (item.quantity || 0) + quantity, 0) ?? 0,
    [cart],
  )

  const hidden = pathname?.startsWith('/products/') || pathname === '/cart'
  if (hidden) return null

  const profileHref = user ? '/account' : '/login'
  const isActive = (href: string) => pathname === href

  return (
    <nav className="border-border bg-card fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around">
        <Link
          aria-label="Home"
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}
          href="/"
        >
          <HomeIcon className="size-5" />
          Home
        </Link>

        <button
          aria-label="Chat"
          className="text-muted-foreground flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
          onClick={() => {
            ensureFeaturebaseBooted()
            showChat()
          }}
          type="button"
        >
          <MessageCircleIcon className="size-5" />
          Chat
        </button>

        <Link
          aria-label="Wishlist"
          className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive('/wishlist') ? 'text-primary' : 'text-muted-foreground'}`}
          href="/wishlist"
        >
          <span className="relative">
            <HeartIcon className="size-5" />
            <NavIconBadge count={wishlistIds.length} />
          </span>
          Wishlist
        </Link>

        <Link
          aria-label="Cart"
          className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive('/cart') ? 'text-primary' : 'text-muted-foreground'}`}
          href="/cart"
        >
          <span className="relative">
            <ShoppingBagIcon className="size-5" />
            <NavIconBadge count={cartQuantity} />
          </span>
          Cart
        </Link>

        <Link
          aria-label="Profile"
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive(profileHref) ? 'text-primary' : 'text-muted-foreground'}`}
          href={profileHref}
        >
          <UserIcon className="size-5" />
          Profile
        </Link>
      </div>
    </nav>
  )
}
