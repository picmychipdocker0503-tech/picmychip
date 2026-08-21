import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import { redirects } from './redirects'

const require = createRequire(import.meta.url)
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
// `ANALYZE=true pnpm build` writes an interactive treemap of every client
// bundle to .next/analyze/*.html instead of opening a browser tab (no
// display in this environment) — open those files directly to inspect them.
const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({
        enabled: true,
        openAnalyzer: false,
      })
    : (config: NextConfig) => config

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const NEXT_PUBLIC_ASSET_DOMAIN = process.env.NEXT_PUBLIC_ASSET_DOMAIN || 'https://assets.picmychip.in'

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    // Without this, Next's default (a matter of seconds) means the optimizer
    // response is barely cached at all — the browser ends up sending a
    // conditional request for the same image on nearly every repeat view,
    // and each of those costs a real round trip to the image-optimization
    // worker rather than being served straight from the browser's own disk
    // cache. Not set to something much longer (e.g. a year, matching
    // `_next/static`'s immutable caching) because filenames here aren't
    // content-hashed (see generateFileURL in plugins/index.ts) — an editor
    // replacing an existing Media document's file can end up reusing the
    // same URL, so a correction should still show up for real visitors
    // within a day rather than staying stale for months.
    minimumCacheTTL: 86400,
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
      // Legacy R2 dev subdomain — superseded by NEXT_PUBLIC_ASSET_DOMAIN
      // (assets.picmychip.in), but Media docs uploaded before that switch
      // still have this domain baked into their persisted `url` field, so
      // it has to stay allowlisted until those rows are migrated. Remove
      // once no Media doc references pub-7c6d69d70a8d4fe29a512343fc36dd9d.r2.dev.
      {
        protocol: 'https',
        hostname: 'pub-7c6d69d70a8d4fe29a512343fc36dd9d.r2.dev',
      },
      ...[NEXT_PUBLIC_SERVER_URL, NEXT_PUBLIC_ASSET_DOMAIN]
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
  experimental: {
    // The homepage and ~200 product/blog/guide pages recently became eligible
    // for static generation (removed the cookie-based locale read that was
    // forcing the whole app dynamic). That's the intended win, but it means
    // `next build` now actually executes every page's data-fetching — including
    // Payload's heavy multi-block "pages" query — for real, concurrently,
    // across every worker. At the default worker count (one per CPU core) that
    // burst of simultaneous connections was enough to OOM this project's Neon
    // compute mid-build. Capping workers trades some build time for staying
    // under that ceiling. Raise this (or remove it) if the production Neon
    // compute is sized larger than what hit the OOM here.
    cpus: 2,
  },
}

export default withBundleAnalyzer(withNextIntl(withPayload(nextConfig)))
