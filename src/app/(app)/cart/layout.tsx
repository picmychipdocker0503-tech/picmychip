import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// cart/page.tsx is a client component ('use client'), so metadata can't be
// exported from it directly — a sibling layout is the standard way to give
// a client-component page its own <title>. Without this, an SEO crawl flags
// "Title tag is missing or empty" here (confirmed via a SEMrush site audit).
export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review the items in your cart before checkout.',
  robots: { index: false, follow: true },
}

export default function CartLayout({ children }: { children: ReactNode }) {
  return children
}
