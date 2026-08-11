import { RequiredDataFromCollectionSlug } from 'payload'

import { heading, paragraph, richText } from './richtext-helpers'

export const aboutPageData: () => RequiredDataFromCollectionSlug<'pages'> = () => {
  return {
    slug: 'about',
    _status: 'published',
    title: 'About Us',
    hero: {
      type: 'lowImpact',
      richText: richText([
        heading('About Picmychip', 'h1'),
        paragraph(
          'We started Picmychip because sourcing electronic components online too often means guessing — mismatched footprints, vague voltage ratings, and photos that don’t match what shows up. We built a catalog where every listing carries the real, verified spec sheet.',
        ),
      ]),
    },
    layout: [
      {
        blockType: 'content',
        columns: [
          {
            size: 'full',
            richText: richText([
              heading('What We Do'),
              paragraph(
                'Picmychip stocks resistors, capacitors, connectors, ICs, drone parts, and more — every listing backed by a verified datasheet, not a guess. Alongside the catalog, we run build-to-order services: custom PCB manufacturing, 3D printing, laser cutting, and battery pack assembly for makers, students, and small manufacturers who need parts that actually match spec.',
              ),
              heading('Why It Matters'),
              paragraph(
                'A wrong footprint or an unverified voltage rating can waste a build and a week of shipping time. We check every listing against its datasheet before it goes live, and we ship fast so a wrong order is a quick fix, not a project stall.',
              ),
              heading('Who We Serve'),
              paragraph(
                'Hobbyist makers, robotics students, drone builders, and small hardware teams who need parts they can trust and services that fill the gaps a home workshop can’t cover.',
              ),
            ]),
          },
        ],
      },
      { blockType: 'trustBadgesStrip', badges: [] },
    ],
    meta: {
      title: 'About Us | Picmychip',
      description:
        'Picmychip verifies every listing against its datasheet before it goes live — resistors, capacitors, connectors, ICs, and more for makers, students, and hardware teams.',
    },
  }
}
