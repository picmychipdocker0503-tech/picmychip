import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// wishlist/page.tsx is a client component ('use client'), so metadata can't
// be exported from it directly — a sibling layout is the standard way to
// give a client-component page its own <title>. Without this, an SEO crawl
// flags "Title tag is missing or empty" here (confirmed via a SEMrush site
// audit).
export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'Products you have saved for later.',
  robots: { index: false, follow: true },
}

export default function WishlistLayout({ children }: { children: ReactNode }) {
  return children
}
