'use client'

import { AuthProvider } from '@/providers/Auth'
import { CompareProvider } from '@/providers/Compare'
import { EcommerceAuthSync } from '@/providers/EcommerceAuthSync'
import { QuickViewProvider } from '@/providers/QuickView'
import { RecentlyViewedProvider } from '@/providers/RecentlyViewed'
import { WishlistProvider } from '@/providers/Wishlist'
import { QuickViewModal } from '@/components/product/QuickViewModal'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { payuAdapterClient } from '@/payments/payu/client'
import { FeaturebaseProvider } from 'featurebase-js/react'
import React, { useState } from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'
import { currenciesConfig } from '@/lib/currencies'

// Matches the `md` breakpoint MobileTabBar hides itself above — mobile
// already has a dedicated "Chat" tab in that bottom nav, so Featurebase's
// own floating launcher bubble is redundant clutter there (it visibly
// overlapped the bottom nav). Desktop has no such bottom nav, so it keeps
// the floating launcher. Read once via a lazy initializer rather than a
// resize listener — this only needs to match the device class at load, and
// evaluating it doesn't affect any server-rendered markup (it's forwarded
// into an imperative SDK boot() call, not used in JSX), so there's no
// hydration-mismatch risk despite differing between the server and client
// passes.
const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [hideDefaultLauncher] = useState(isMobileViewport)

  return (
    <FeaturebaseProvider appId="6a630b8ebfd7b125f2342f3f" hideDefaultLauncher={hideDefaultLauncher}>
      <ThemeProvider>
        <AuthProvider>
          <HeaderThemeProvider>
            <SonnerProvider />
            <EcommerceProvider
              enableVariants={true}
              currenciesConfig={currenciesConfig}
              api={{
                cartsFetchQuery: {
                  depth: 2,
                  populate: {
                    products: {
                      slug: true,
                      title: true,
                      gallery: true,
                      inventory: true,
                      gstPercent: true,
                    },
                    variants: {
                      title: true,
                      inventory: true,
                    },
                  },
                  // The plugin's own default cart query only selects `items`/`subtotal` — every
                  // other field the storefront reads off `cart` (currency, coupon/gift-card
                  // state) has to be added here explicitly or it comes back `undefined` even
                  // though the value is correct in the database. This is what caused Card/UPI
                  // checkout to look permanently unavailable: `cart.currency` was never fetched.
                  select: {
                    currency: true,
                    appliedCouponCode: true,
                    couponDiscountAmount: true,
                    appliedGiftCardCode: true,
                    giftCardAmountApplied: true,
                    // Without this, the create-cart response never carries
                    // `secret` back to the client, so the ecommerce
                    // provider never persists it to localStorage — guest
                    // carts silently lose their only proof of ownership,
                    // and every subsequent guest cart request (including
                    // this app's own /api/cart/discount) has nothing to
                    // authenticate against.
                    secret: true,
                  },
                },
              }}
              paymentMethods={[payuAdapterClient()]}
            >
              <EcommerceAuthSync />
              <CompareProvider>
                <WishlistProvider>
                  <RecentlyViewedProvider>
                    <QuickViewProvider>
                      {children}
                      <QuickViewModal />
                    </QuickViewProvider>
                  </RecentlyViewedProvider>
                </WishlistProvider>
              </CompareProvider>
            </EcommerceProvider>
          </HeaderThemeProvider>
        </AuthProvider>
      </ThemeProvider>
    </FeaturebaseProvider>
  )
}
