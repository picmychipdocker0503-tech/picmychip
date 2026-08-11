import { RequiredDataFromCollectionSlug } from 'payload'

import { bulletList, heading, paragraph, richText } from './richtext-helpers'

const introHero = (title: string, intro: string) => ({
  type: 'lowImpact' as const,
  richText: richText([heading(title, 'h1'), paragraph(intro)]),
})

export const makerMistakesPostData: () => RequiredDataFromCollectionSlug<'guides'> = () => ({
  slug: 'mistakes-first-time-makers-make',
  _status: 'published',
  title: '5 Mistakes First-Time Makers Make (And How to Avoid Them)',
  excerpt: 'Common pitfalls we see in first orders — and how to sidestep them before you solder.',
  contentType: 'article',
  authorName: 'Ananya Tallanje',
  hero: introHero(
    '5 Mistakes First-Time Makers Make',
    'After watching thousands of first orders come through, a handful of mistakes show up again and again. Here\'s how to skip them.',
  ),
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richText([
            heading('1. Ordering Without Checking the Footprint'),
            paragraph(
              'A part can be electrically perfect and still not fit your board if the footprint doesn\'t match what you designed for. Always cross-check package type (0603 vs 0805, THT vs SMD) against your PCB layout before ordering.',
            ),
            heading('2. Skipping the Voltage/Current Headroom'),
            paragraph(
              'Running a component right at its rated limit works — until it doesn\'t. Build in headroom, especially on capacitors and regulators, so normal variance in your circuit doesn\'t push a part past its spec.',
            ),
            heading('3. Reversing Polarity on Electrolytics and LEDs'),
            paragraph(
              'The single most common support question we get. Check the stripe on electrolytic capacitors and the flat edge on LEDs before you solder — desoldering is a lot more work than a five-second check.',
            ),
            heading('4. Ordering One of Everything "Just in Case"'),
            paragraph(
              'It\'s tempting to over-order variety early on. Start with the values your design actually calls for, then build a stock of commonly-used values (like the E12 resistor series) once you know what you reach for often.',
            ),
            heading('5. Not Reading the Datasheet\'s Fine Print'),
            bulletList([
              'Storage/handling notes for moisture-sensitive parts',
              'Minimum order-specific tolerances for the batch',
              'Recommended soldering temperature profiles',
            ]),
            paragraph(
              'Every listing on Picmychip links the full datasheet — it\'s worth the two minutes, especially for anything going into a design you\'ll build more than once.',
            ),
          ]),
        },
      ],
    },
  ],
  meta: {
    title: '5 Mistakes First-Time Makers Make | Picmychip Blog',
    description: 'Common first-order pitfalls for new makers, and how to avoid them.',
  },
})

export const qaProcessPostData: () => RequiredDataFromCollectionSlug<'guides'> = () => ({
  slug: 'inside-our-qc-process',
  _status: 'published',
  title: 'Inside Our QC Process: What "Verified Spec" Actually Means',
  excerpt: 'A look at how every listing gets checked against its datasheet before it goes live.',
  contentType: 'article',
  authorName: 'Balakumar S',
  hero: introHero(
    'Inside Our QC Process',
    'You\'ll see "verified spec" on every listing across the catalog. Here\'s what actually happens before a part earns that label.',
  ),
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richText([
            heading('Where It Starts: The Datasheet'),
            paragraph(
              'Before a new part goes live, we pull the manufacturer\'s datasheet and check it against the listing draft line by line — voltage/current ratings, package dimensions, tolerance, and pinout where relevant.',
            ),
            heading('Photo Verification'),
            paragraph(
              'Listing photos are shot from real stock, not manufacturer marketing images. What you see in the gallery is what ships — down to the markings on the package.',
            ),
            heading('Spot Checks on Incoming Batches'),
            paragraph(
              'New stock from any supplier gets a sample pulled and bench-tested against the datasheet spec before the batch is released into inventory. If a batch doesn\'t match, it doesn\'t go live.',
            ),
            heading('Why This Matters'),
            bulletList([
              'A resistor with a wrong tolerance can throw off a precision circuit',
              'A capacitor with the wrong voltage rating can fail under load',
              'A mismatched footprint means a redesign, not just a reorder',
            ]),
            paragraph(
              'The two minutes we spend verifying a listing is meant to save you the hours it takes to debug a circuit built on a part that quietly didn\'t match its spec.',
            ),
          ]),
        },
      ],
    },
  ],
  meta: {
    title: 'Inside Our QC Process | Picmychip Blog',
    description: 'How every listing on Picmychip gets checked against its datasheet before going live.',
  },
})

export const teamCulturePostData: () => RequiredDataFromCollectionSlug<'guides'> = () => ({
  slug: 'life-on-the-Picmychip-team',
  _status: 'published',
  title: 'Behind the Bench: Life on the Picmychip Team',
  excerpt: 'What it\'s like working on a small team building for makers, students, and hardware builders.',
  contentType: 'article',
  authorName: 'Praveen Kumar Devendran',
  authorTitle: 'People & Culture',
  hero: introHero(
    'Behind the Bench',
    'A small team, a big catalog, and a customer base that will absolutely tell us when a spec is wrong. Here\'s what building Picmychip day to day actually looks like.',
  ),
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richText([
            heading('Who We Build For'),
            paragraph(
              'Our customers range from students soldering their first board to small hardware teams shipping production runs. That range keeps every team — catalog, support, sourcing — honest about getting the details right, because someone\'s build depends on it.',
            ),
            heading('What We Look For When We Hire'),
            bulletList([
              'Genuine curiosity about how things work, not just what they\'re called',
              'Comfort saying "I don\'t know, let me check the datasheet" instead of guessing',
              'Patience for the unglamorous work — verifying specs, checking stock, answering the same question kindly for the hundredth time',
            ]),
            heading('How We Work'),
            paragraph(
              'Small team, short feedback loops. If a customer flags a wrong spec or a broken listing, it usually gets fixed the same day — there\'s no multi-week backlog between "someone noticed" and "someone fixed it."',
            ),
            heading('Growing With Our Customers'),
            paragraph(
              'A lot of our roadmap comes directly from support conversations — a category we didn\'t stock, a service someone wished we offered, a spec field that was missing. We\'d rather build what people actually ask for than guess.',
            ),
          ]),
        },
      ],
    },
  ],
  meta: {
    title: 'Behind the Bench: Life on the Picmychip Team | Picmychip Blog',
    description: 'What it\'s like working on the small team behind Picmychip.',
  },
})

export const sourcingPostData: () => RequiredDataFromCollectionSlug<'guides'> = () => ({
  slug: 'how-we-source-and-vet-components',
  _status: 'published',
  title: 'How We Source and Vet Components From Verified Distributors',
  excerpt: 'A behind-the-scenes look at how parts get from distributor to your cart.',
  contentType: 'article',
  authorName: 'Keerthan Kumar P',
  authorTitle: 'Supply Chain',
  hero: introHero(
    'How We Source and Vet Components',
    'Every part in the catalog passed through a sourcing process before it ever showed up as a listing. Here\'s what that looks like.',
  ),
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: richText([
            heading('Choosing Distributors'),
            paragraph(
              'We work with authorized distributors and manufacturers directly wherever possible — not gray-market resellers. That traceability is what lets us stand behind a part\'s authenticity, not just its listed spec.',
            ),
            heading('Batch-Level Traceability'),
            paragraph(
              'Incoming stock is tracked by batch, not just by part number. If a manufacturer issues a notice about a specific production run, we can trace exactly which of our stock is affected instead of pulling an entire product line.',
            ),
            heading('Balancing Stock Against Demand'),
            bulletList([
              'High-turnover parts (common resistor/capacitor values, popular connectors) are kept in deeper stock',
              'Specialty and low-volume parts are ordered against forecasted demand to avoid long dead stock',
              'Lead times are tracked per supplier so we can flag likely delays before they become backorders',
            ]),
            heading('What Happens When a Batch Doesn\'t Pass'),
            paragraph(
              'If an incoming batch fails our spot-check against the datasheet, it\'s held and returned to the supplier rather than released into inventory — even if that means a temporary stockout on that part.',
            ),
          ]),
        },
      ],
    },
  ],
  meta: {
    title: 'How We Source and Vet Components | Picmychip Blog',
    description: 'A behind-the-scenes look at how Picmychip sources and verifies components before they\'re listed.',
  },
})
