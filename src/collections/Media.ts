import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { adminOnly } from '@/access/adminOnly'
import { isAuthenticated } from '@/access/isAuthenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  admin: {
    group: 'Content',
  },
  slug: 'media',
  access: {
    // Any logged-in user can create a media doc (needed so customers can
    // upload their own avatar) — update/delete stay admin-only so no one
    // can tamper with existing media, including other users' avatars.
    create: isAuthenticated,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    staticDir: path.resolve(dirname, '../../public/media'),
    // Next's own image optimizer already re-encodes to WebP/AVIF when
    // *serving* a request, but that doesn't help the very first request for
    // a given size — that one still has to fetch and decode whatever's
    // actually stored on R2 first. Some existing uploads (AI-generated
    // product shots especially) are 1.5-1.8MB PNGs, well above the ~130KB
    // average; storing new uploads as WebP (keeps alpha transparency, unlike
    // JPEG) cuts that origin-fetch step's size at the source, and the width
    // cap is a backstop against a future oversized upload rather than a
    // response to anything seen so far — nothing in this catalog is
    // displayed anywhere near 2400px.
    formatOptions: {
      format: 'webp',
      options: { quality: 85 },
    },
    resizeOptions: {
      width: 2400,
      withoutEnlargement: true,
    },
  },
}
