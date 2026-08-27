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
    { source: '/signin', destination: '/login', permanent: true },
    { source: '/signup', destination: '/create-account', permanent: true },
    { source: '/register', destination: '/create-account', permanent: true },
    { source: '/my-account', destination: '/account', permanent: true },
  ]

  return [internetExplorerRedirect, ...aliasRedirects]
}
