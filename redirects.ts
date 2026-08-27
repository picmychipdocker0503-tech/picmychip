import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // Common URL aliases visitors/search engines try that 404 on this app's
  // actual routes. Every destination below was verified against the real
  // Pages collection slugs and app router folders before adding — a
  // redirect to a route that doesn't exist just trades one 404 for
  // another. permanent: true (308) since these are stable, intentional
  // aliases, not temporary reroutes.
  const aliasRedirects = [
    // Old Google-indexed product URLs — trailing numeric IDs and legacy
    // singular /product/ path from a previous platform. More specific
    // rules first so a plain numeric ID gets the exact same destination as
    // any other trailing junk, then the catch-all mops up the rest.
    { source: '/products/:slug/:id(\\d+)', destination: '/products/:slug', permanent: true },
    { source: '/product/:slug/:id(\\d+)', destination: '/products/:slug', permanent: true },
    { source: '/products/:slug/:extra+', destination: '/products/:slug', permanent: true },
    { source: '/product/:slug', destination: '/products/:slug', permanent: true },

    // Old categories from a previous platform (WordPress/Shopify-style paths)
    { source: '/product-category/:slug*', destination: '/category/:slug*', permanent: true },
    { source: '/collections/:slug*', destination: '/shop', permanent: true },

    // Discontinued standalone service pages from a previous site version —
    // NOT a blanket /services/:path* redirect, since /services/[slug] (Maker
    // Studio: PCB manufacturing, 3D printing, laser cutting, battery packs)
    // is a real, currently-live section and that would break it.
    { source: '/pcb-design', destination: '/rfq', permanent: true },
    { source: '/iot-solutions', destination: '/rfq', permanent: true },
    { source: '/iot-product-development', destination: '/rfq', permanent: true },
    { source: '/embedded-software', destination: '/rfq', permanent: true },
    { source: '/vave-analysis', destination: '/rfq', permanent: true },

    // Contact & About (CMS-managed pages, served via the [slug] route)
    { source: '/contact-us', destination: '/contact', permanent: true },
    { source: '/contactus', destination: '/contact', permanent: true },
    { source: '/about-us', destination: '/about', permanent: true },
    { source: '/faqs', destination: '/faq', permanent: true },
    { source: '/blogs', destination: '/blog', permanent: true },
    { source: '/career', destination: '/careers', permanent: true },
    { source: '/jobs', destination: '/careers', permanent: true },
    { source: '/our-team', destination: '/team', permanent: true },

    // Policies (CMS-managed pages)
    { source: '/terms-and-conditions', destination: '/terms', permanent: true },
    { source: '/terms-of-service', destination: '/terms', permanent: true },
    { source: '/privacy', destination: '/privacy-policy', permanent: true },
    { source: '/shipping', destination: '/shipping-policy', permanent: true },
    { source: '/refund', destination: '/cancellation-refund-policy', permanent: true },
    { source: '/refund-policy', destination: '/cancellation-refund-policy', permanent: true },
    { source: '/return-policy', destination: '/cancellation-refund-policy', permanent: true },

    // Store & Catalog
    { source: '/search', destination: '/shop', permanent: true },
    { source: '/products', destination: '/shop', permanent: true },
    { source: '/category', destination: '/shop', permanent: true },
    { source: '/store', destination: '/shop', permanent: true },
    { source: '/catalog', destination: '/shop', permanent: true },
    { source: '/track-order', destination: '/find-order', permanent: true },

    // Auth & Accounts
    { source: '/forgotpassword', destination: '/forgot-password', permanent: true },
    { source: '/signin', destination: '/login', permanent: true },
    { source: '/signup', destination: '/create-account', permanent: true },
    { source: '/register', destination: '/create-account', permanent: true },
    { source: '/my-account', destination: '/account', permanent: true },
  ]

  return [internetExplorerRedirect, ...aliasRedirects]
}
