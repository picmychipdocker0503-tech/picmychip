/* eslint-disable no-restricted-exports */
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000'

export const revalidate = 3600

export default async function robots() {
  return {
    host: baseUrl,
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/account',
          '/orders',
          '/checkout',
          '/login',
          '/create-account',
          '/forgot-password',
          '/logout',
          '/find-order',
          '/compare',
          '/next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
