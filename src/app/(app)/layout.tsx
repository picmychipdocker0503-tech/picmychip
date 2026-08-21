import type { Viewport } from 'next'
import type { ReactNode } from 'react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { CompareBar, InstallPrompt } from '@/components/GlobalOverlays'
import { JsonLd } from '@/components/JsonLd'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { MobileTabBar } from '@/components/MobileTabBar'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { ensureStartsWith } from '@/utilities/ensureStartsWith'
import { buildOrganizationJsonLd } from '@/utilities/jsonLd'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { GeistMono } from 'geist/font/mono'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import React from 'react'
import './globals.css'

// A thinner, more professional grotesk than the previous GeistSans — aliased
// to the same `--font-geist-sans` CSS variable Tailwind's `font-sans` theme
// token already points at (see globals.css), so nothing downstream needs to
// change. Weights cover every Tailwind font-weight utility already in use
// across the site (font-medium through font-black).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

const GA_MEASUREMENT_ID = 'G-65M0W91R3Q'
const enableThirdPartyScripts = process.env.NODE_ENV === 'production'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#005d1e' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

/* const { SITE_NAME, TWITTER_CREATOR, TWITTER_SITE } = process.env
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000'
const twitterCreator = TWITTER_CREATOR ? ensureStartsWith(TWITTER_CREATOR, '@') : undefined
const twitterSite = TWITTER_SITE ? ensureStartsWith(TWITTER_SITE, 'https://') : undefined
 */
/* export const metadata = {
  metadataBase: new URL(baseUrl),
  robots: {
    follow: true,
    index: true,
  },
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  ...(twitterCreator &&
    twitterSite && {
      twitter: {
        card: 'summary_large_image',
        creator: twitterCreator,
        site: twitterSite,
      },
    }),
} */

export default async function RootLayout({ children }: { children: ReactNode }) {
  const siteSettings = await getCachedGlobal('site-settings', 0)()
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      className={[inter.variable, GeistMono.variable].filter(Boolean).join(' ')}
      lang={locale}
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/icons/apple-touch-icon.png" rel="apple-touch-icon" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="Picmychip" name="apple-mobile-web-app-title" />
      </head>
      <body>
        {enableThirdPartyScripts && (
          <>
            <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
            </Script>
          </>
        )}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <LivePreviewListener />
            <ServiceWorkerRegistration />
            <JsonLd data={buildOrganizationJsonLd(siteSettings)} />

            <a className="skip-link" href="#main-content">
              Skip to content
            </a>

            <Header />
            <main className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0" id="main-content">
              {children}
            </main>
            <Footer />
            <CompareBar />
            <InstallPrompt />
            <MobileTabBar />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
