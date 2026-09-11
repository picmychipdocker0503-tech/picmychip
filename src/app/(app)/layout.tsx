import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { getServerSideURL } from '@/utilities/getURL'

import { Footer } from '@/components/Footer'
import { CompareBar, GoogleOneTapPrompt, InstallPrompt, TawkCartOffsetSync } from '@/components/GlobalOverlays'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { MobileTabBar } from '@/components/MobileTabBar'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/utilities/jsonLd'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GeistMono } from 'geist/font/mono'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Inter } from 'next/font/google'
import { draftMode } from 'next/headers'
import Script from 'next/script'
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
// Falls back to the widget already live in Tawk.to if the env vars aren't set.
const TAWK_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || '6a880f991e47873444f4db0f'
const TAWK_WIDGET_ID = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || '1k0hnpsg3'
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

// Site-wide fallback — inherited by any page that doesn't set its own
// metadata, and merged (not replaced) into pages that do. In particular this
// is the only place `twitter` and `metadataBase` are set anywhere in the
// app, so every page gets a proper Twitter card for free (Twitter/X falls
// back to the page's own OG title/image/description when card-specific
// fields aren't set — only `card` needs to be declared).
//
// `robots` is gated on VERCEL_ENV rather than NODE_ENV: Vercel sets this
// automatically to 'production' | 'preview' | 'development', so preview
// deployments get noindexed with zero extra deployment config, while local
// dev and any non-Vercel host (where the var is unset) default to indexable.
const isVercelPreview = process.env.VERCEL_ENV === 'preview'

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  description: 'Genuine electronic components, connectors, and cables, sourced and shipped fast.',
  robots: {
    follow: !isVercelPreview,
    index: !isVercelPreview,
  },
  title: {
    default: 'Picmychip',
    template: '%s | Picmychip',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [siteSettings, locale, messages, { isEnabled: isDraftMode }] = await Promise.all([
    getCachedGlobal('site-settings', 0)(),
    getLocale(),
    getMessages(),
    draftMode(),
  ])

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
            {/* lazyOnload (not afterInteractive) — live chat isn't needed in the
                first second, and deferring it to idle time keeps it off the
                main thread during the Core Web Vitals TBT measurement window. */}
            <Script id="tawk-to" strategy="lazyOnload">
              {`
            var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
            // Mobile already has its own "Chat" tab in the bottom nav (see
            // MobileTabBar), so Tawk's own default floating bubble is
            // redundant clutter there — hidden once the widget loads.
            // Desktop has no such bottom nav, so it keeps the bubble.
            Tawk_API.onLoad = function () {
              if (window.matchMedia('(max-width: 767px)').matches) {
                Tawk_API.hideWidget();
              }
            };
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `}
            </Script>
          </>
        )}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {/* Only wired up for Payload's live-preview iframe (draft mode) —
                rendering it unconditionally on every public page caused an
                infinite request loop on any 404: Next.js retries the RSC
                payload fetch for router.refresh() against a route that
                doesn't resolve to real content on a not-found boundary, and
                each retry 404s and retries again. See
                https://github.com/vercel/next.js/issues/86197. Regular
                visitors are never in draft mode, so this never mattered for
                them anyway — only CMS editors previewing drafts need it. */}
            {isDraftMode && <LivePreviewListener />}
            <ServiceWorkerRegistration />
            <JsonLd data={buildOrganizationJsonLd(siteSettings)} />
            <JsonLd data={buildWebSiteJsonLd()} />

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
            <GoogleOneTapPrompt clientId={process.env.GOOGLE_CLIENT_ID} />
            <TawkCartOffsetSync />
            <MobileTabBar />
          </Providers>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
