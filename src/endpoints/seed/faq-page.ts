import { RequiredDataFromCollectionSlug } from 'payload'

import { heading, paragraph, richText } from './richtext-helpers'

const qa = (question: string, answer: string) => ({
  question,
  answer: richText([paragraph(answer)]),
})

export const faqPageData: () => RequiredDataFromCollectionSlug<'pages'> = () => {
  return {
    slug: 'faq',
    _status: 'published',
    title: 'FAQ',
    hero: {
      type: 'lowImpact',
      richText: richText([
        heading('Frequently Asked Questions', 'h1'),
        paragraph('Answers to the questions we hear most about orders, shipping, returns, and our build-to-order services.'),
      ]),
    },
    layout: [
      {
        blockType: 'faq',
        eyebrow: 'Support',
        heading: 'Common questions',
        description: 'Can\'t find what you\'re looking for? Reach out and our team will get back to you shortly.',
        contactCard: {
          enabled: true,
          heading: 'Still have questions?',
          description: 'Our team typically responds within a few hours.',
          linkLabel: 'Contact support',
          linkUrl: '/contact',
        },
        items: [
          qa(
            'Are the component specs on your listings verified?',
            'Yes — every listing is checked against its manufacturer datasheet before it goes live, including voltage/current ratings, footprint, and package type. If a spec ever looks off, contact us and we\'ll correct it.',
          ),
          qa(
            'How fast do orders ship?',
            'In-stock orders placed before 3pm ship the same day. You\'ll get a tracking link by email as soon as the order leaves our warehouse.',
          ),
          qa(
            'What is your return policy?',
            'Unused components in original packaging can be returned within 15 days of delivery for a refund or store credit. See our Terms & Refund Policy page for the full process.',
          ),
          qa(
            'Can I track my order?',
            'Yes — use the "Track an Order" link in the footer, or check your account\'s Orders page if you checked out while signed in.',
          ),
          qa(
            'Do you offer bulk or business pricing?',
            'Yes, for larger quantities or recurring business orders, reach out via the Contact page with the parts and quantities you need and we\'ll put together a quote.',
          ),
          qa(
            'What custom services do you offer besides parts?',
            'We run build-to-order PCB manufacturing (2-8 layers), FDM/resin 3D printing, laser cutting, and custom Li-ion/LiPo battery packs. See the Services section for turnaround times and specs.',
          ),
          qa(
            'What if a part arrives damaged or doesn\'t match the listing?',
            'Contact us with your order number and photos within 48 hours of delivery and we\'ll replace it or refund it — no return shipping needed for our error.',
          ),
          qa(
            'Do you ship internationally?',
            'We currently ship within India. For international orders, reach out via the Contact page and we\'ll confirm what\'s possible for your location.',
          ),
        ],
      },
    ],
    meta: {
      title: 'FAQ | Picmychip',
      description:
        'Answers about verified specs, shipping times, returns, order tracking, bulk pricing, and our PCB/3D printing/laser cutting services.',
    },
  }
}
