import type { Metadata } from 'next'

import { HelpCenterClient, type HelpLink, type HelpSection } from '@/components/help/HelpCenterClient'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

// Every href below is a real, existing route — verified against the live
// site rather than guessed. No new pages are introduced here; this is a
// directory over what already exists (order tracking, RFQ/BOM upload,
// returns, account, guides, FAQ, policies).
const QUICK_LINKS: HelpLink[] = [
  { title: 'Track your order', description: 'By email + order ID', href: '/find-order' },
  { title: 'Upload a BOM', description: 'Get a quote on your parts list', href: '/rfq?upload=1' },
  { title: 'Request a quote', description: 'Bulk or custom pricing', href: '/rfq#rfq-form' },
  { title: 'Start a return', description: 'Return or refund an order', href: '/returns' },
  { title: 'Contact support', description: 'Chat, email, or call', href: '/contact' },
  { title: 'Browse FAQs', description: 'Common questions', href: '/faq' },
]

const SECTIONS: HelpSection[] = [
  {
    title: 'Orders & Sourcing',
    icon: 'orders',
    links: [
      { title: 'Track an order', description: 'Find your order status with your email and order ID.', href: '/find-order' },
      { title: 'Order history', description: 'View past orders (sign in required).', href: '/orders' },
      { title: 'Upload a BOM for a quote', description: 'Send your full parts list for pricing.', href: '/rfq?upload=1' },
      { title: 'Request a quote (RFQ)', description: 'Ask about bulk pricing or a specific part.', href: '/rfq#rfq-form' },
    ],
  },
  {
    title: 'Shipping',
    icon: 'shipping',
    links: [
      { title: 'Shipping policy', description: 'Dispatch times, carriers, and delivery estimates.', href: '/shipping-policy' },
      { title: 'Track an order', description: 'See where your shipment is right now.', href: '/find-order' },
    ],
  },
  {
    title: 'Returns & Refunds',
    icon: 'returns',
    links: [
      { title: 'Start a return or refund', description: 'Request a return for a wrong or damaged part.', href: '/returns' },
      { title: 'Cancellation & refund policy', description: 'How cancellations and refunds are handled.', href: '/cancellation-refund-policy' },
    ],
  },
  {
    title: 'Payments & Account',
    icon: 'payments',
    links: [
      { title: 'Your account', description: 'Manage your profile and saved details.', href: '/account' },
      { title: 'Saved addresses', description: 'Add or edit shipping addresses.', href: '/account/addresses' },
      { title: 'Sign in', description: 'Access your account and order history.', href: '/login' },
      { title: 'Create an account', description: "Don't have one yet? Sign up here.", href: '/create-account' },
      { title: 'Privacy policy', description: 'How we handle your data.', href: '/privacy-policy' },
      { title: 'Terms', description: 'Terms of using Picmychip.', href: '/terms' },
    ],
  },
  {
    title: 'Guides',
    icon: 'guides',
    links: [
      { title: 'Component guides', description: 'Explainers on parts, specs, and selection.', href: '/guides' },
      { title: 'Frequently asked questions', description: 'Quick answers to common questions.', href: '/faq' },
    ],
  },
]

export const metadata: Metadata = {
  description: 'Find help with orders, sourcing, shipping, returns, and your Picmychip account.',
  openGraph: mergeOpenGraph({
    title: 'Help Center',
    url: '/help',
  }),
  title: 'Help Center — Picmychip: Electronic Components Store',
}

export default async function HelpPage() {
  const featureFlags = await getCachedGlobal('feature-flags', 0)()
  const payload = await getPayload({ config: configPromise })

  const guides = await payload.find({
    collection: 'guides',
    depth: 0,
    draft: false,
    limit: 8,
    overrideAccess: false,
    sort: '-updatedAt',
    where: { authorName: { exists: false } },
    select: {
      title: true,
      slug: true,
      excerpt: true,
    },
  })

  const sections = SECTIONS.map((section) => {
    if (section.title !== 'Guides' || guides.docs.length === 0) return section

    return {
      ...section,
      links: [
        ...guides.docs.map((guide) => ({
          title: guide.title,
          description: guide.excerpt || 'Read the guide',
          href: `/guides/${guide.slug}`,
          illustration: guide.slug,
        })),
        { title: 'Frequently asked questions', description: 'Quick answers to common questions.', href: '/faq' },
      ],
    }
  })

  // Track-an-order links point to /find-order, which is gated by the same
  // flag that hides the top utility bar's "Track order" link — keep the
  // Help Center consistent with that instead of linking to a hidden feature.
  const quickLinks = featureFlags?.trackOrder
    ? QUICK_LINKS
    : QUICK_LINKS.filter((link) => link.href !== '/find-order')

  const filteredSections = featureFlags?.trackOrder
    ? sections
    : sections.map((section) => ({
        ...section,
        links: section.links.filter((link) => link.href !== '/find-order'),
      }))

  return <HelpCenterClient quickLinks={quickLinks} sections={filteredSections} />
}
