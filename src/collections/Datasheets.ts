import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { adminOnly } from '@/access/adminOnly'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Datasheets: CollectionConfig = {
  slug: 'datasheets',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  upload: {
    mimeTypes: ['application/pdf'],
    staticDir: path.resolve(dirname, '../../public/datasheets'),
  },
}
