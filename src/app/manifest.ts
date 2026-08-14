import type { MetadataRoute } from 'next'

export const revalidate = 3600

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  return {
    id: '/',
    name: 'Picmychip',
    short_name: 'Picmychip',
    description: 'Electronics components, in stock and ready to ship.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#005d1e',
    categories: ['shopping', 'business'],
    shortcuts: [
      {
        name: 'Shop',
        url: '/shop',
      },
      {
        name: 'Track Order',
        url: '/find-order',
      },
    ],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32',
        type: 'image/x-icon',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
