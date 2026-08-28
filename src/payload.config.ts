import { transactionalEmailPayloadAdapter } from '@/lib/email/payloadAdapter'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { en } from '@payloadcms/translations/languages/en'

import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import fs from 'fs'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Brands } from '@/collections/Brands'
import { Categories } from '@/collections/Categories'
import { CommunityFeedback } from '@/collections/CommunityFeedback'
import { Coupons } from '@/collections/Coupons'
import { Datasheets } from '@/collections/Datasheets'
import { EmailEvents } from '@/collections/EmailEvents'
import { GiftCards } from '@/collections/GiftCards'
import { Guides } from '@/collections/Guides'
import { Jobs } from '@/collections/Jobs'
import { Media } from '@/collections/Media'
import { NewsletterSubscribers } from '@/collections/NewsletterSubscribers'
import { Pages } from '@/collections/Pages'
import { ReturnRequests } from '@/collections/ReturnRequests'
import { Reviews } from '@/collections/Reviews'
import { RfqSubmissions } from '@/collections/RfqSubmissions'
import { Services } from '@/collections/Services'
import { StockAlerts } from '@/collections/StockAlerts'
import { TeamTestimonials } from '@/collections/TeamTestimonials'
import { Users } from '@/collections/Users'
import { Wishlists } from '@/collections/Wishlists'
import { FeatureFlags } from '@/globals/FeatureFlags'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { SiteSettings } from '@/globals/SiteSettings'
import { shouldUseMeilisearch } from '@/lib/meilisearch'
import { configureProductsIndex } from '@/lib/searchIndex'
import { plugins } from './plugins'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Explicit CA (e.g. AWS RDS's own bundle, POSTGRES_CA_CERT=./certs/rds-ca.pem)
// verifies the real chain instead of disabling verification outright — and,
// confirmed live, `rejectUnauthorized: false` alone did NOT suppress "self-
// signed certificate in certificate chain" against RDS: pg-connection-string
// parses the connection string's own `sslmode=require`/`channel_binding`
// into its own strict (verify-full-equivalent) ssl config, which took
// precedence over an explicit `ssl` object regardless of what it contained.
// Stripping those params from the string — confirmed live, this is what
// actually made the explicit `ssl` object below take effect — hands full
// control back to it: the real CA when configured (RDS), or
// rejectUnauthorized: false otherwise (e.g. Neon, which doesn't need one and
// was presumably only "working" because its cert already chains to a
// publicly-trusted CA regardless of this setting).
const postgresSSL = process.env.POSTGRES_CA_CERT
  ? { ca: fs.readFileSync(path.resolve(process.cwd(), process.env.POSTGRES_CA_CERT)).toString(), rejectUnauthorized: true }
  : { rejectUnauthorized: false }

const postgresConnectionString = (() => {
  const raw = process.env.DATABASE_URL || ''
  if (!raw) return raw
  try {
    const url = new URL(raw)
    url.searchParams.delete('sslmode')
    url.searchParams.delete('channel_binding')
    return url.toString()
  } catch {
    return raw
  }
})()

export default buildConfig({
  // Required for any collection's `upload.resizeOptions`/`formatOptions` to
  // actually run (Media.ts sets both) — without this, Payload silently skips
  // image processing and warns "sharp not installed" even though the
  // package is a real, installed dependency, because it only looks for a
  // `sharp` module passed in through config, never node_modules directly.
  sharp,
  // Formalizes the admin panel's language config so adding a language pack
  // later is a one-line change. Hindi isn't available here — unlike the
  // storefront's next-intl setup, @payloadcms/translations doesn't ship a
  // Hindi pack, and hand-authoring Payload's own translation-key schema is
  // out of scope for now.
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en },
  },
  admin: {
    meta: {
      titleSuffix: '- Picmychip Admin',
      description: 'Admin panel for managing Picmychip products, orders, and site content.',
      icons: [
        { rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
        { rel: 'icon', sizes: '32x32', url: '/favicon.ico' },
      ],
      openGraph: {
        siteName: 'Picmychip Admin',
        title: 'Picmychip Admin',
        description: 'Admin panel for managing Picmychip products, orders, and site content.',
        images: [{ url: '/icons/icon-512.png' }],
      },
    },
    components: {
      // Renders top-right of every admin page (not just the dashboard).
      actions: ['@/components/admin/EnvironmentBadge#EnvironmentBadge'],
      // Quick-jump search above the sidebar nav links — a static list, not a
      // live filter of the real nav (see NavSearch's own comment for why).
      beforeNavLinks: ['@/components/admin/NavSearch#NavSearch'],
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
      graphics: {
        Icon: '@/components/icons/AdminLogo#AdminIcon',
        Logo: '@/components/icons/AdminLogo#AdminLogo',
      },
      views: {
        bulkStock: {
          Component: '@/components/admin/BulkStockView#BulkStockView',
          path: '/bulk-stock',
        },
        bulkProducts: {
          Component: '@/components/admin/BulkProductsView#BulkProductsView',
          path: '/bulk-products',
        },
        reports: {
          Component: '@/components/admin/ReportsView#ReportsView',
          path: '/reports',
        },
        abandonedCheckouts: {
          Component: '@/components/admin/AbandonedCheckoutsView#AbandonedCheckoutsView',
          path: '/abandoned-checkouts',
        },
        reviewRequests: {
          Component: '@/components/admin/ReviewRequestsView#ReviewRequestsView',
          path: '/review-requests',
        },
      },
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Pages,
    Categories,
    Media,
    Datasheets,
    Guides,
    Jobs,
    Brands,
    Reviews,
    Services,
    CommunityFeedback,
    TeamTestimonials,
    NewsletterSubscribers,
    Coupons,
    GiftCards,
    StockAlerts,
    Wishlists,
    ReturnRequests,
    RfqSubmissions,
    EmailEvents,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: postgresConnectionString,
      ssl: postgresSSL,
    },

    // Schema changes go through `payload migrate:create` + `payload migrate` in every
    // environment. Push mode's per-request introspection is fine over localhost but
    // takes 30-60s per request against a remote host like Neon.
    push: false,
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages', 'guides'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  // Only activates once an email provider is configured — order-confirmation,
  // shipping-update, back-in-stock, gift-card, newsletter, and account
  // (verify/forgot-password) emails all no-op (logged, not thrown) until
  // then. When BREVO_API_KEY is set, this is the transactional email
  // service (src/lib/email/emailService.ts) — Brevo primary, ZeptoMail
  // fallback, retries, idempotency — so even Payload's own internal
  // verify/forgot-password sends benefit from the fallback, not just the
  // app's own hooks (which call the service directly via src/lib/email.ts).
  ...(process.env.BREVO_API_KEY
    ? {
        email: transactionalEmailPayloadAdapter(),
      }
    : process.env.SMTP_HOST
      ? {
          email: nodemailerAdapter({
            defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@Picmychip.com',
            defaultFromName: process.env.EMAIL_FROM_NAME || 'Picmychip',
            transportOptions: {
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT) || 587,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            },
          }),
        }
      : {}),
  endpoints: [],
  globals: [Header, Footer, SiteSettings, FeatureFlags],
  onInit: async (payload) => {
    if (!shouldUseMeilisearch()) {
      payload.logger.info('Meilisearch disabled, search will use the database fallback')
      return
    }

    try {
      const status = await configureProductsIndex()
      payload.logger.info({
        message: 'Meilisearch connected',
        url: status.host,
        health: status.healthStatus,
        index: status.indexUid,
        indexStatus: status.indexCreated ? 'created' : 'available',
        filterableAttributes: status.filterableAttributes,
        searchableAttributes: status.searchableAttributes,
      })
    } catch (error) {
      payload.logger.warn(`Meilisearch unreachable at boot, search will use the database fallback: ${error}`)
    }
  },
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
