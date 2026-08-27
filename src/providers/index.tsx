'use client'

import { AuthProvider } from '@/providers/Auth'
import { CartDrawerProvider } from '@/providers/CartDrawer'
import { CompareProvider } from '@/providers/Compare'
import { EcommerceAuthSync } from '@/providers/EcommerceAuthSync'
import { QuickViewProvider } from '@/providers/QuickView'
import { RecentlyViewedProvider } from '@/providers/RecentlyViewed'
import { ThemeAccountSync } from '@/providers/ThemeAccountSync'
import { WishlistProvider } from '@/providers/Wishlist'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { payuAdapterClient } from '@/payments/payu/client'
import dynamic from 'next/dynamic'
import React from 'react'

// Renders nothing until a product is actually quick-viewed, so every page
// paying for its Radix Dialog + cart/wishlist deps upfront (rather than only
// the pages where a shopper opens quick view) was pure waste.
const QuickViewModal = dynamic(
  () => import('@/components/product/QuickViewModal').then((mod) => mod.QuickViewModal),
  { ssr: false },
)

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'
import { currenciesConfig } from '@/lib/currencies'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeAccountSync />
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
            <CartDrawerProvider>
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
            </CartDrawerProvider>
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
