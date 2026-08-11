import { RequiredDataFromCollectionSlug } from 'payload'

const textNode = (text: string) => ({ type: 'text', text, version: 1 })

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const heading = (text: string, tag: 'h1' | 'h2' | 'h3' = 'h2') => ({
  type: 'heading',
  tag,
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

type RichTextNode = { type: string; version: number; [key: string]: unknown }

const richText = (nodes: RichTextNode[]) => ({
  root: {
    type: 'root',
    children: nodes,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

/**
 * Rendered directly by src/app/(app)/[slug]/page.tsx whenever no "home" page
 * exists in the database yet (e.g. before the seed script has run). Mirrors
 * the real seeded homepage in makerStore.ts so visitors never see placeholder
 * content, and degrades gracefully — the archive blocks pull real products
 * the moment any exist, with no category/product IDs required.
 */
export const homeStaticData: () => RequiredDataFromCollectionSlug<'pages'> = () => {
  return {
    slug: 'home',
    _status: 'published',
    hero: {
      type: 'illustrated',
      illustrationKey: 'workshop',
      richText: richText([
        heading('Electronic Components, Connectors & Cables', 'h1'),
        paragraph(
          'Resistors, capacitors, diodes, connectors, cables, ICs, and drone parts — every listing shows the specs that actually matter, so you order the right part the first time.',
        ),
      ]),
      links: [
        {
          link: { type: 'custom', url: '/shop', label: 'Shop All Products', newTab: false, appearance: 'default' },
        },
        {
          link: { type: 'custom', url: '/guides', label: 'Browse Guides', newTab: false, appearance: 'outline' },
        },
      ],
    },
    layout: [
      {
        blockType: 'trustBadgesStrip',
        badges: [
          {
            icon: 'shipping',
            label: 'Same-Day Dispatch',
            description: 'Orders placed before 3 PM ship the same business day directly from verified stock.',
          },
          {
            icon: 'verified',
            label: '100% Datasheet-Verified',
            description: 'Every part listing is checked for voltage, tolerance, and pinout accuracy.',
          },
          {
            icon: 'secure',
            label: 'Secure Payments',
            description: 'Fast and encrypted checkout with instant order confirmations.',
          },
          {
            icon: 'returns',
            label: '30-Day Hassle-Free Returns',
            description: 'Return or exchange unopened components directly from your account.',
          },
          {
            icon: 'support',
            label: 'Dedicated Engineer Support',
            description: 'Speak directly with hardware and electronics specialists.',
          },
        ],
      },
      {
        blockType: 'customerInteraction',
        eyebrow: 'ENGINEER & MAKER ASSISTANCE',
        heading: 'Tell us what you are building. We will help you source it.',
        intro:
          'Get part suggestions, availability checks, bulk reel pricing, and build-to-order service help from our technical hardware team.',
        channels: [
          {
            type: 'quote',
            title: 'BOM & Volume Quote',
            description: 'Upload your Bill of Materials for volume pricing and lead time estimates.',
            responseTime: 'Within 2 hours',
          },
          {
            type: 'technical',
            title: 'Component Selection Help',
            description: 'Ask for pin-compatible alternatives or cross-reference obsolete ICs.',
            responseTime: 'Within 4 hours',
          },
          {
            type: 'service',
            title: 'Custom Cable & Kitting',
            description: 'Order custom harness assemblies and pre-sorted maker lab kits.',
            responseTime: 'Same day',
          },
        ],
        steps: [
          {
            label: '1. Submit your specs',
            detail: 'Share your schematic, BOM spreadsheet, or component parameter requirements.',
          },
          {
            label: '2. Review verified quote',
            detail: 'Receive spec-matched items with stock availability and volume tier discounts.',
          },
          {
            label: '3. Rapid dispatch',
            detail: 'Components packed in anti-static reels and dispatched straight to your workbench.',
          },
        ],
        metrics: [
          { value: '50,000+', label: 'Verified Components' },
          { value: '< 2 Hours', label: 'Average Response Time' },
          { value: '99.8%', label: 'Order Accuracy' },
        ],
        primaryLink: {
          type: 'custom',
          url: '/shop',
          label: 'Explore Catalog',
        },
        secondaryLink: {
          type: 'custom',
          url: '/services',
          label: 'Maker Services',
        },
      },
      {
        blockType: 'archive',
        introContent: richText([heading('Featured In-Stock Components')]),
        populateBy: 'collection',
        relationTo: 'products',
        categories: [],
        limit: 8,
      },
      {
        blockType: 'content',
        columns: [
          {
            size: 'oneThird',
            richText: richText([
              heading('Spec-Verified', 'h3'),
              paragraph(
                'Every listing shows the real numbers — tolerance, voltage rating, package size — not just marketing copy.',
              ),
            ]),
            enableLink: false,
          },
          {
            size: 'oneThird',
            richText: richText([
              heading('Fast Shipping', 'h3'),
              paragraph('In-stock orders ship within 1 business day directly to your door.'),
            ]),
            enableLink: false,
          },
          {
            size: 'oneThird',
            richText: richText([
              heading('Genuine Components', 'h3'),
              paragraph('Every part is sourced and checked for authenticity — no counterfeits, no surprises.'),
            ]),
            enableLink: false,
          },
        ],
      },
      {
        blockType: 'testimonials',
        heading: 'What Engineers & Makers Say',
        populateBy: 'selection',
        testimonials: [
          {
            name: 'Vikram S.',
            role: 'Robotics Lead @ AeroLabs',
            rating: 5,
            quote:
              'Picmychip is the only distributor where the package footprints and dielectric ratings in the listing actually match the parts in the box. Saved our team days on our latest drone revision.',
          },
          {
            name: 'Priya M.',
            role: 'Embedded Hardware Developer',
            rating: 5,
            quote:
              'Super fast dispatch and authentic silicon. Having instant access to pinout specs right on the product page makes component selection effortless.',
          },
          {
            name: 'Arjun K.',
            role: 'Maker & PCB Designer',
            rating: 5,
            quote:
              'The spec search is incredible. Ordered SMD passives and microcontroller modules on Tuesday, had them on my bench Wednesday afternoon.',
          },
        ],
      },
      {
        blockType: 'faq',
        heading: 'Frequently Asked Questions',
        items: [
          {
            question: 'How do you ensure component authenticity?',
            answer: richText([
              paragraph(
                'All passives, ICs, and connectors are sourced directly from verified manufacturer reels with traceable batch lot numbers. Every batch undergoes visual inspection and spec verification before entering our inventory.',
              ),
            ]),
          },
          {
            question: 'How fast do orders ship?',
            answer: richText([
              paragraph(
                'All in-stock orders placed before 3 PM ship the same business day with real-time tracking from dispatch to delivery.',
              ),
            ]),
          },
          {
            question: 'What is your return policy?',
            answer: richText([
              paragraph(
                'Unopened components and dev boards can be returned within 30 days of delivery for a full refund or exchange.',
              ),
            ]),
          },
        ],
      },
      {
        blockType: 'cta',
        richText: richText([
          heading('Ready to start your next build?', 'h2'),
          paragraph(
            'Explore over 50,000 spec-verified components, developer kits, and connectors with same-day dispatch.',
          ),
        ]),
        links: [
          {
            link: {
              type: 'custom',
              url: '/shop',
              label: 'Explore Catalog',
              appearance: 'default',
            },
          },
          {
            link: {
              type: 'custom',
              url: '/guides',
              label: 'View Hardware Guides',
              appearance: 'outline',
            },
          },
        ],
      },
    ],
    meta: {
      description:
        'Spec-verified resistors, capacitors, diodes, connectors, cables, ICs, and drone parts for makers, engineers, and hobbyists.',
      title: 'Picmychip — Electronic Components, Connectors & Cables',
    },
    title: 'Home',
  } as unknown as RequiredDataFromCollectionSlug<'pages'>
}
