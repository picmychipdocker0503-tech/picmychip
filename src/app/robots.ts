/* eslint-disable no-restricted-exports */
import { getServerSideURL } from '@/utilities/getURL'

const baseUrl = getServerSideURL()

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
