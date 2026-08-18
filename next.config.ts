import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'
import { redirects } from './redirects'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [90, 100],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      ...[NEXT_PUBLIC_SERVER_URL, R2_PUBLIC_URL]
        .filter((item): item is string => Boolean(item))
        .map((item) => {
          const url = new URL(item)

          return {
            hostname: url.hostname,
            protocol: url.protocol.replace(':', '') as 'http' | 'https',
            // Leave default-port URLs (no explicit :port) with port: '' — Next.js's
            // remotePatterns matcher only matches an explicit port against an explicit
            // port. Forcing '443'/'80' here means it never matches a real image URL,
            // since those never carry a redundant default port.
            port: url.port,
          }
        }),
    ],
  },
  reactStrictMode: true,
  redirects,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  // Security headers — Payload's admin panel and the storefront share this
  // Next app, so X-Frame-Options is SAMEORIGIN (not DENY) to keep Live
  // Preview's iframe working; HSTS only takes effect once actually served
  // over HTTPS (harmless in local dev over http).
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          // PayU is a full top-level redirect, not an embedded iframe/payment-request context,
          // so unlike Stripe/Razorpay's in-page checkout, no external origin needs allowlisting here.
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
        },
      ],
    },
    {
      // The service worker file itself must never be cached by the browser
      // or an intermediary — that's the one thing that makes update
      // detection work at all. A cached sw.js means the browser keeps
      // running the OLD worker (and its old CACHE_NAME) indefinitely,
      // regardless of how well versioned the cache-cleanup logic inside it
      // is, since it never even sees the new file to run that logic from.
      source: '/sw.js',
      headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
    },
  ],
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withNextIntl(withPayload(nextConfig))
