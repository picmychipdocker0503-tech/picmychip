# Picmychip — Electronic Components Store

An electronics-components e-commerce platform built on [Payload CMS](https://payloadcms.com) and [Next.js](https://nextjs.org) (App Router). Customers browse a spec-verified parts catalog, upload a BOM or request a bulk quote, track orders as a guest or a registered account, and pay via PayU (cards/UPI/NetBanking) or Cash on Delivery. Admins manage the whole catalog, orders, and sourcing pipeline from a Payload admin panel with custom dashboards built on TanStack React Table.

## Features

**Storefront**

- Product catalog with variants, per-category spec sheets, datasheets, and multi-image galleries
- BOM/RFQ upload and quote-request flow for bulk or custom sourcing (`/rfq`)
- Guest and account order tracking (`/find-order`), with a secure emailed access token for guests
- Cart with coupons, gift cards, and an Amazon-style mini-cart popover on add
- Wishlist with a "saved — add to cart / buy now" popover
- Product comparison, quick view, and "frequently bought together" bundles
- 32 selectable themes (light/dark/high-contrast and more), with a logged-in user's choice saved to their account and followed across devices
- Help Center, FAQ, guides/blog, and a resistor color-code calculator tool
- Reviews, back-in-stock alerts, and abandoned-cart recovery email
- Installable as a PWA
- Search and faceted filtering via Meilisearch, with a database fallback if it's unreachable

**Admin**

- Custom TanStack React Table list views (sortable/paginated/searchable, with bulk delete) across every collection — Products, Orders, Carts, Transactions, Users, RFQ Submissions, Stock Alerts, Wishlists, Email Events, Form Submissions, and more
- Feature flags global to toggle storefront features (Cash on Delivery, gift cards, coupons, back-in-stock alerts, product comparison, etc.) without a deploy
- Sales/inventory dashboards, bulk stock editor, abandoned-checkout and review-request tools
- Zoho Books integration — auto-creates a Sales Order on checkout, converts to an invoice once accepted
- Zoho Desk integration for support tickets
- Google Merchant Center product feed
- Transactional email via Brevo (primary) with a ZeptoMail fallback

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + [React](https://react.dev) + TypeScript
- [Payload CMS](https://payloadcms.com) 3.x on Postgres, with the [ecommerce](https://payloadcms.com/docs/ecommerce/plugin), [form-builder](https://payloadcms.com/docs/plugins/form-builder), and [SEO](https://payloadcms.com/docs/plugins/seo) plugins
- Tailwind CSS v4 + daisyUI, [shadcn/ui](https://ui.shadcn.com) components, [TanStack Table](https://tanstack.com/table)
- [PayU](https://www.payu.in) payments (custom adapter — see [PayU](#payu))
- [Meilisearch](https://www.meilisearch.com) for search/facets
- [Zoho Books](https://www.zoho.com/books) and [Zoho Desk](https://www.zoho.com/desk) integrations
- Cloudflare R2 (S3-compatible) for media storage in production
- Vercel Analytics & Speed Insights

## Quick start

1. Clone the repo
2. `cp .env.example .env` and fill in at least `PAYLOAD_SECRET` and `DATABASE_URL` (see [Environment variables](#environment-variables) for everything else)
3. `pnpm install`
4. Start Postgres (and optionally Meilisearch) locally — `docker compose up -d` uses the included `docker-compose.yml`, or point `DATABASE_URL` at your own instance
5. `pnpm dev` and open `http://localhost:3000`
6. Follow the on-screen prompt to create your first admin user at `/admin`

### Working with Postgres

This project uses **migrations**, not `push` mode — schema changes go through `payload migrate:create` + `payload migrate` in every environment (see `payload.config.ts`, `db.push: false`). After changing a collection/global's fields:

```bash
pnpm payload migrate:create <name>
pnpm payload migrate
```

Migration files live in `src/migrations` and are registered in `src/migrations/index.ts`.

### Seeding

A seed script exists under `src/endpoints/seed` (triggered from the admin panel's "seed database" link) but is not the source of the current catalog — this project's real product, category, and content data was populated directly, not from the generic seed. Running it will overwrite existing data, so only use it against a database you're happy to reset.

## Environment variables

See `.env.example` for the full, commented list. The main groups:

| Group | Variables | Notes |
| --- | --- | --- |
| Core | `PAYLOAD_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_ASSET_DOMAIN` | Required |
| Payments | `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `PAYU_MODE` | See [PayU](#payu) |
| Search | `MEILI_HOST`, `MEILI_MASTER_KEY`, `REINDEX_SECRET` | Optional — falls back to DB queries |
| Email | `BREVO_API_KEY`, `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`, `ZEPTOMAIL_*` | Optional — logs instead of sending until configured |
| Zoho Books | `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ORGANIZATION_ID`, `ZOHO_TAX_ID_MAP` | Optional — no-ops until all required vars are set |
| Media storage | `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` | Optional — falls back to local disk uploads |
| Misc | `GOOGLE_MERCHANT_FEED_SECRET`, `INVENTORY_WEBHOOK_SECRET`, `PREVIEW_SECRET` | Shared secrets for their respective endpoints |

## PayU

`@payloadcms/plugin-ecommerce` has no first-party PayU adapter, so this project ships a custom one (`src/payments/payu`). Set `PAYU_MERCHANT_KEY` and `PAYU_MERCHANT_SALT` from your [PayU dashboard](https://onboarding.payu.in/signup) (or the [test credentials guide](https://docs.payu.in/docs/generate-test-merchant-key-and-salt) for a sandbox key/salt); `PAYU_MODE` selects `test` (default) or `production`.

PayU settles in INR only — card/UPI/NetBanking checkout is unavailable for carts in other currencies (Cash on Delivery still works). Unlike a JS-modal checkout, PayU's integration redirects the browser to a PayU-hosted payment page, then PayU POSTs the result back to `/api/payments/payu/callback` (`src/payments/payu/endpoints/callback.ts`). For local testing, that callback URL must be reachable from PayU's servers — tunnel `localhost:3000` (e.g. with ngrok) and point PayU at the tunneled URL.

## Access control

- `users`: `admin` role has full admin-panel access; `customer` role is limited to the storefront and their own records
- `products`/`categories`/`guides`/etc: published content is publicly readable; only admins can create/update/delete
- `carts`: customers access their own cart; guests access an unclaimed cart by ID
- `orders`: admins and the owning user; guests need a valid `accessToken` (emailed) plus the order's email
- `transactions`: admin-only

## Scripts

```bash
pnpm dev              # start the dev server
pnpm build            # run pending migrations, then build for production
pnpm start            # serve the production build
pnpm generate:types   # regenerate src/payload-types.ts from the current config
pnpm lint             # eslint
pnpm test:int         # Vitest integration tests
pnpm test:e2e         # Playwright e2e tests
pnpm test             # both of the above
```

## Deployment

1. `pnpm build` (runs pending migrations, then `next build`)
2. `pnpm start` to serve

This app can be deployed anywhere Node.js/Next.js runs — a VPS, Render, Vercel (with `@payloadcms/db-vercel-postgres` if using Vercel Postgres), etc. When self-hosting media uploads, configure the R2 (or another S3-compatible) variables above; otherwise uploads are written to local disk, which most hosts don't persist across deploys.
