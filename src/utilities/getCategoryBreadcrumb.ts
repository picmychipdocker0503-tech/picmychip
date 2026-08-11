import type { Payload } from 'payload'

import type { Category } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const MAX_DEPTH = 5

/**
 * Walks a category's `parent` chain (added in Phase 1) up to the root,
 * returning an ordered Home > Shop > ... > Category breadcrumb trail.
 */
export const getCategoryBreadcrumb = async (
  payload: Payload,
  category: Category,
): Promise<{ name: string; url: string }[]> => {
  const baseUrl = getServerSideURL()
  const trail: { name: string; url: string }[] = []

  let current: Category | null = category
  let depth = 0

  while (current && depth < MAX_DEPTH) {
    trail.unshift({ name: current.title, url: `${baseUrl}/category/${current.slug}` })

    if (!current.parent) {
      current = null
    } else if (typeof current.parent === 'object') {
      current = current.parent
    } else {
      current = await payload.findByID({ collection: 'categories', id: current.parent }).catch(() => null)
    }

    depth += 1
  }

  return [{ name: 'Home', url: baseUrl }, { name: 'Shop', url: `${baseUrl}/shop` }, ...trail]
}
