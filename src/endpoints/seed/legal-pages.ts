import { RequiredDataFromCollectionSlug } from 'payload'

import { bulletList, heading, numberedList, paragraph, richText } from './richtext-helpers'

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
    title: 'Terms & Conditions',
    hero: {
      type: 'lowImpact',
      richText: richText([heading('Terms & Conditions', 'h1')]),
    },
    layout: [
      {
        blockType: 'content',
        columns: [
          {
            size: 'full',
            richText: richText([
              heading('Acceptance of These Terms'),
              paragraph(
                "By accessing this website or placing an order, you agree to be bound by these Terms of Service. If any part is unacceptable to you, please discontinue use of the site rather than placing an order. These Terms apply to every order placed through this site, operated by BKC Picmychip Tech Services Private Limited (\"the Company,\" \"we,\" \"us\").",
              ),
              heading("The Company's Role — Authorized Distributor / Retailer"),
              paragraph(
                'The Company operates strictly as an authorized distributor and retailer of electronic components, semiconductors, hardware modules, and drone parts sourced from third-party manufacturers and authorized supply chains. The Company does not manufacture, design, or fabricate the products listed on this site unless a listing explicitly states otherwise (for example, custom PCB, 3D-printing, or laser-cutting services ordered as build-to-order work).',
              ),
              paragraph(
                'This distinction matters for warranty purposes — see "Warranty Disclaimer & Manufacturer Claims Support" below — and for how liability is allocated between the Company and the original manufacturer.',
              ),
              heading('Eligibility & Account'),
              paragraph(
                'You must be at least 18 years old, or place orders under the supervision of a person who is, and capable of entering a binding contract under the Indian Contract Act, 1872, to place an order. Information you provide at checkout or account creation must be accurate and kept current; you are responsible for activity under your account credentials.',
              ),
              heading('Product Listings, Pricing & GST'),
              paragraph(
                'All prices are listed in INR and, unless stated otherwise, are inclusive of applicable GST. A GST-compliant tax invoice, showing the Company\'s GSTIN 29AAMCB6502D1ZS, is issued for every order. Listed specifications are sourced from manufacturer datasheets in good faith; minor packaging or revision differences between what is pictured and what is shipped do not constitute a defect where the part number and specification match.',
              ),
              paragraph(
                'Orders are subject to stock availability and price confirmation at the time of checkout. In the rare case of a listing error (incorrect price or specification), the Company may cancel the affected order and issue a full refund per the Cancellation & Refund Policy before dispatch.',
              ),
              heading('Orders & Payment'),
              paragraph(
                'An order is confirmed once payment is successfully authorized through our payment partner. Orders paid by direct bank transfer are confirmed once the transfer is verified against the invoice. The Company reserves the right to decline or cancel an order on reasonable suspicion of fraud, pricing error, or an inability to fulfil it — customers are notified and refunded in full where payment was already collected.',
              ),
              heading('Warranty Disclaimer & Manufacturer Claims Support'),
              paragraph(
                "The Company does not itself warrant the products it sells. As a distributor/retailer rather than a manufacturer, all warranty obligations for a product's performance, reliability, or freedom from defects rest with the original manufacturer, under that manufacturer's own published warranty terms, duration, and coverage — which vary by brand and product line.",
              ),
              paragraph(
                'This is not a gap in support — it is a routing structure. The Company provides a structured support channel so you never have to deal with a manufacturer directly:',
              ),
              numberedList([
                'Raise a claim with our support team at sales@picmychip.com with your order number, the manufacturer\'s part number, and a description of the fault.',
                'Acknowledgement within 2 business days, and — where the manufacturer requires it — the Company facilitates the claim on your behalf rather than requiring you to contact the manufacturer directly.',
                'Resolution follows the manufacturer\'s own warranty process (repair, replacement, or credit), which the Company communicates to you as it becomes available. Typical manufacturer turnaround is 2–4 weeks, outside the Company\'s control.',
              ]),
              paragraph(
                'Transit damage and dead-on-arrival (DOA) components are handled separately and faster, under the Shipping Policy — they do not wait on a manufacturer\'s warranty process.',
              ),
              paragraph(
                'Not covered under any manufacturer warranty, and not the Company\'s responsibility to remedy: damage from incorrect voltage/polarity, ESD mishandling, reflow/soldering damage, physical modification, or use outside the manufacturer\'s rated conditions.',
              ),
              heading('Acceptable Use'),
              paragraph(
                'You agree not to use the site for unlawful purposes, to attempt to circumvent security controls, to resell products in violation of manufacturer distribution terms, or to place orders using fraudulent payment details.',
              ),
              heading('Intellectual Property'),
              paragraph(
                "Site content, layout, and original photography belong to the Company; manufacturer datasheets, logos, and trademarks belong to their respective owners and are used for identification purposes only.",
              ),
              heading('Limitation of Liability'),
              paragraph(
                "To the extent permitted by law, the Company's liability for any claim relating to an order is limited to the value of that order. The Company is not liable for indirect, incidental, or consequential loss — including project delays, lost data, or damage to other equipment arising from component misuse, incorrect handling, or incorrect specification selection by the buyer.",
              ),
              heading('Indemnity'),
              paragraph(
                'You agree to indemnify the Company against claims, losses, or damages arising from your misuse of a product, violation of these Terms, or infringement of a third party\'s rights.',
              ),
              heading('Grievance Redressal Officer'),
              paragraph(
                'In accordance with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000, the Company has appointed a Grievance Officer to address complaints regarding products, orders, or this website.',
              ),
              paragraph(
                'Name: S. Bala · Designation: Grievance Officer · Email: sales@picmychip.com · Phone: +91 90876 06060 (Mon–Fri, 10:00 AM – 6:00 PM IST) · Address: BKC PICMYCHIP TECH SERVICES PRIVATE LIMITED, F-86, 3rd Floor, Vinyas Building, ITI Limited, Dooravani Nagar, Bengaluru Urban, Karnataka 560016, India.',
              ),
              paragraph(
                'Complaints are acknowledged within 48 hours and resolved within 30 days, per Rule 4(4)(b) of the E-Commerce Rules.',
              ),
              heading('Governing Law & Jurisdiction'),
              paragraph(
                "These Terms are governed by the laws of India. Subject to the buyer's statutory right to approach their local consumer forum under the Consumer Protection Act, 2019, any other dispute is subject to the exclusive jurisdiction of the courts at Bengaluru, Karnataka.",
              ),
              heading('Changes to These Terms'),
              paragraph(
                'The Company may revise these Terms as the business or applicable law changes. The version in effect at the time you place an order governs that order; material changes are dated at the top of this page.',
              ),
            ]),
          },
        ],
      },
    ],
    meta: {
      title: 'Terms & Conditions | Picmychip',
      description:
        "Picmychip's terms of service — our role as an authorized distributor, order and payment terms, manufacturer warranty claims support, and governing law.",
    },
  }
}

export const shippingPolicyPageData: () => RequiredDataFromCollectionSlug<'pages'> = () => {
  return {
    slug: 'shipping-policy',
    _status: 'published',
    title: 'Shipping Policy',
    hero: {
      type: 'lowImpact',
      richText: richText([heading('Shipping, Delivery & Inspection Policy', 'h1')]),
    },
    layout: [
      {
        blockType: 'content',
        columns: [
          {
            size: 'full',
            richText: richText([
              heading('Order Processing & Dispatch'),
              paragraph(
                'In-stock orders placed before 4.00pm on a working day are dispatched the same day; orders placed after cutoff, or containing a build-to-order item (custom PCB, 3D print, laser cut, custom battery pack), dispatch once that item is ready. You\'ll see the applicable dispatch estimate at checkout and in your order confirmation email.',
              ),
              heading('Shipping Partners & Charges'),
              paragraph(
                'Orders ship via our courier partners; the courier and tracking number are shared once the order is dispatched. Shipping charges, where applicable, are shown at checkout before payment.',
              ),
              heading('Delivery & Transfer of Risk'),
              paragraph(
                "Risk in the goods — responsibility for their physical condition — passes to you upon delivery to the address on your order, or to the person accepting delivery on your behalf. This is exactly why the inspection window below exists: to give you a defined, fair opportunity to identify and report anything that went wrong in transit before that risk transfer becomes final.",
              ),
              heading('The 3-Working-Day Inspection Window'),
              paragraph(
                'You have 3 working days from the date of delivery to inspect your shipment and confirm receipt. Within this window, check that:',
              ),
              bulletList([
                'The outer packaging and component packaging arrived intact, with no crushing, puncture, or moisture damage.',
                'The quantity and part numbers received match your order confirmation.',
                'Components power on and respond as expected where a basic bench test is practical (dead-on-arrival check).',
              ]),
              paragraph(
                'If you raise no issue within this window, the order is treated as received in good condition, and any subsequent claim of transit damage or DOA is handled under manufacturer warranty (see Terms & Conditions) rather than as a shipping issue.',
              ),
              paragraph(
                'Working days excludes Sundays and applicable national/state holidays. The window starts the calendar day after the courier\'s delivery scan.',
              ),
              heading('Reporting Transit Damage, Breakage & DOA'),
              paragraph(
                'To report damage, breakage, or a dead-on-arrival component within the 3-working-day window, email sales@picmychip.com with your order number and:',
              ),
              numberedList([
                'Unboxing video or photographs of the unopened package and shipping label, showing the condition it arrived in.',
                'Photographs or video of the damaged/DOA item itself, including any visible physical damage, and — for a DOA claim — a short clip of the bench test showing the failure.',
                'The manufacturer part number and quantity affected.',
              ]),
              paragraph(
                "Claims submitted without this photographic/video evidence, or submitted after the 3-working-day window has closed, cannot be processed as a shipping claim — they're routed to manufacturer warranty support instead, which may carry different timelines and outcomes.",
              ),
              heading('What Happens After You Report'),
              paragraph(
                'Verified transit-damage and DOA claims are resolved by replacement where stock allows, or refund per the Cancellation & Refund Policy, at no cost to you — no return shipping charge, no restocking fee. We acknowledge a report within 24 to 48 business hours and aim to resolve it within 5 to 7 business days of receiving your evidence.',
              ),
              heading('Non-Delivery, Refused & Undeliverable Shipments'),
              paragraph(
                "If a shipment is returned to us as undeliverable (incorrect address, repeated failed delivery attempts, or refusal at the door), we'll contact you to arrange redelivery at your cost or a refund of the product value, less the original outbound shipping charge.",
              ),
              heading('Contact for Shipping Issues'),
              paragraph('For tracking, delivery, or inspection questions: sales@picmychip.com.'),
            ]),
          },
        ],
      },
    ],
    meta: {
      title: 'Shipping Policy | Picmychip',
      description:
        'Dispatch timelines, delivery risk transfer, and the mandatory 3-working-day window to report transit damage, breakage, or DOA components.',
    },
  }
}

export const cancellationRefundPolicyPageData: () => RequiredDataFromCollectionSlug<'pages'> = () => {
  return {
    slug: 'cancellation-refund-policy',
    _status: 'published',
    title: 'Cancellation & Refund Policy',
    hero: {
      type: 'lowImpact',
      richText: richText([heading('Cancellation & Refund Policy', 'h1')]),
    },
    layout: [
      {
        blockType: 'content',
        columns: [
          {
            size: 'full',
            richText: richText([
              heading('Cancelling Before Dispatch — Free'),
              paragraph(
                'You may cancel any order, free of charge and in full, at any time before it is marked Dispatched in your order status. Cancel from your account\'s order page, or by emailing sales@picmychip.com with your order number. Refunds for pre-dispatch cancellations follow "Refund Timelines" below.',
              ),
              heading('Cancelling After Dispatch'),
              paragraph(
                'Once an order is marked Dispatched, it can no longer be cancelled in transit. If you refuse delivery or return an unopened, unused shipment in its original packaging, it is treated as a post-delivery return rather than a cancellation, and is subject to a restocking fee of 15% of the item value plus the original outbound shipping charge, deducted from the refund. Build-to-order items (custom PCB, 3D print, laser cut, custom battery pack) are non-cancellable once production has started.',
              ),
              heading('Cancellations Initiated By Us'),
              paragraph(
                'We may cancel an order before dispatch for reasons including stock unavailability discovered after order confirmation, a pricing or listing error, or reasonable suspicion of fraud. Where payment was already collected, it is refunded in full per "Refund Timelines" below — no restocking fee applies to a cancellation we initiate.',
              ),
              heading('Eligible Returns'),
              paragraph(
                'Outside the pre-dispatch cancellation window, a return is only accepted where it falls into one of two tracks:',
              ),
              bulletList([
                'Transit damage / DOA, reported with evidence inside the 3-working-day inspection window (see Shipping Policy) — free of charge, no restocking fee.',
                "Manufacturer warranty claim, routed through the support channel described in our Terms & Conditions, and resolved under that manufacturer's own terms.",
              ]),
              paragraph(
                'Outside these two tracks — for example, a change of mind after the inspection window has closed — the order is not eligible for return.',
              ),
              heading('Refund Inspection Process'),
              paragraph(
                'Where a physical return is required, we issue a return authorization and address once your claim is approved. Refunds are processed only after the returned item is received and inspected to confirm it matches the reported issue — this inspection takes up to 3 business days from receipt at our facility.',
              ),
              heading('Refund Method — Original Payment Instrument'),
              paragraph('Approved refunds are returned to the original payment method used at checkout:'),
              bulletList([
                'Card, UPI, or wallet payments processed through our payment partner are reversed to the same card, UPI ID, or wallet used to pay — never to an alternate account, per RBI payment-aggregator rules.',
                "Direct bank transfer orders are refunded by NEFT/IMPS to the exact bank account the payment originated from, matching the remitter details on the original tax invoice. We do not credit a refund to a different account than the one that paid, including on your own request, as a fraud-prevention control.",
              ]),
              heading('Refund Timelines'),
              paragraph(
                'Once a refund is approved — immediately for a pre-dispatch cancellation, or on completion of inspection for a return — it is initiated within 2 business days. From there:',
              ),
              bulletList([
                'Card/UPI/wallet reversals typically reflect in 5–7 business days, depending on your bank.',
                'Bank transfer refunds (NEFT/IMPS) typically settle in 2–3 business days of being initiated.',
              ]),
              paragraph(
                "These downstream timings are set by banking networks, not by us — we'll share the transaction reference once initiated so you can track it with your bank if needed.",
              ),
              heading('Non-Refundable Items'),
              paragraph(
                'Build-to-order services — custom PCB manufacturing, 3D printing, laser cutting, and custom battery packs — are non-refundable and non-cancellable once production has started, since they have no resale value once built to your specification.',
              ),
              heading('GST Credit Notes'),
              paragraph(
                'Where an order was invoiced with GST, an approved return or cancellation is accompanied by a GST credit note against the original tax invoice, issued in accordance with Section 34 of the CGST Act, 2017.',
              ),
              heading('Contact for Refunds'),
              paragraph('For a cancellation, return, or refund status: sales@picmychip.com / +91 90876 06060, with your order number.'),
            ]),
          },
        ],
      },
    ],
    meta: {
      title: 'Cancellation & Refund Policy | Picmychip',
      description:
        'Cancellation windows, return eligibility, refund inspection, and refund timelines to your original payment method for Picmychip orders.',
    },
  }
}