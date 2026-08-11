import { RequiredDataFromCollectionSlug } from 'payload'

import { heading, paragraph, richText } from './richtext-helpers'

export const privacyPolicyPageData: () => RequiredDataFromCollectionSlug<'pages'> = () => {
  return {
    slug: 'privacy-policy',
    _status: 'published',
    title: 'Privacy Policy',
    hero: {
      type: 'lowImpact',
      richText: richText([heading('Privacy Policy', 'h1')]),
    },
    layout: [
      {
        blockType: 'content',
        columns: [
          {
            size: 'full',
            richText: richText([
              heading('Information We Collect'),
              paragraph(
                'When you create an account, place an order, or contact us, we collect information such as your name, email, phone number, shipping/billing address, and order history. We do not store your full payment card details — those are handled directly by PayU, our payment processor.',
              ),
              heading('How We Use It'),
              paragraph(
                'We use your information to process orders, provide customer support, send order and shipping updates, and — where you\'ve opted in — send newsletters about new products and offers. We do not sell your personal information to third parties.',
              ),
              heading('Data Security'),
              paragraph(
                'We use industry-standard measures to protect your data in transit and at rest. Payment processing is handled by PayU under their own PCI-compliant security standards.',
              ),
              heading('Cookies'),
              paragraph(
                'We use cookies to keep you signed in, remember your cart, and understand how the site is used so we can improve it. You can disable cookies in your browser, though some features may not work correctly without them.',
              ),
              heading('Third-Party Services'),
              paragraph(
                'We share the minimum information necessary with service providers who help us run the store — payment processing (PayU), shipping/courier partners, and email delivery — solely to fulfill those services.',
              ),
              heading('Your Rights'),
              paragraph(
                'You can request a copy of the personal data we hold about you, ask us to correct it, or request deletion of your account by contacting us. We\'ll respond within a reasonable timeframe.',
              ),
              heading('Contact Us'),
              paragraph(
                'Questions about this policy can be sent through our Contact page.',
              ),
            ]),
          },
        ],
      },
    ],
    meta: {
      title: 'Privacy Policy | Picmychip',
      description:
        'How Picmychip collects, uses, and protects your personal information, including payment processing via PayU and your data rights.',
    },
  }
}

export const termsPolicyPageData: () => RequiredDataFromCollectionSlug<'pages'> = () => {
  return {
    slug: 'terms',
    _status: 'published',
    title: 'Terms of Use & Refund Policy',
    hero: {
      type: 'lowImpact',
      richText: richText([heading('Terms of Use & Refund Policy', 'h1')]),
    },
    layout: [
      {
        blockType: 'content',
        columns: [
          {
            size: 'full',
            richText: richText([
              heading('Acceptance of Terms'),
              paragraph(
                'By using this site and placing an order, you agree to these terms. If you don\'t agree with any part of them, please don\'t use the site to place an order.',
              ),
              heading('Orders & Payment'),
              paragraph(
                'All orders are subject to product availability and price confirmation at checkout. Payments are processed securely through PayU. An order is confirmed once payment is successfully authorized.',
              ),
              heading('Shipping & Delivery'),
              paragraph(
                'In-stock orders placed before 3pm ship the same day. Delivery timelines depend on your location and the courier partner; estimated timelines are shown at checkout. Risk of loss passes to you on delivery.',
              ),
              heading('Returns & Refunds'),
              paragraph(
                'Unused components in their original packaging can be returned within 15 days of delivery for a refund or store credit. Items that arrive damaged or don\'t match the listing are replaced or refunded at no cost to you — contact us with your order number and photos within 48 hours of delivery. Custom build-to-order services (PCB manufacturing, 3D printing, laser cutting, custom battery packs) are non-refundable once production has started.',
              ),
              heading('Warranty'),
              paragraph(
                'Components are covered against manufacturing defects for 30 days from delivery. This warranty does not cover damage from misuse, incorrect voltage/polarity, or normal wear.',
              ),
              heading('Limitation of Liability'),
              paragraph(
                'We are not liable for indirect or consequential damages arising from the use of products purchased on this site, including project delays or damage to other equipment from component misuse.',
              ),
              heading('Governing Law'),
              paragraph(
                'These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of the courts where Picmychip is registered.',
              ),
            ]),
          },
        ],
      },
    ],
    meta: {
      title: 'Terms of Use & Refund Policy | Picmychip',
      description:
        'Our terms for orders, payment, shipping, returns, refunds, and warranty coverage on components and build-to-order services.',
    },
  }
}
