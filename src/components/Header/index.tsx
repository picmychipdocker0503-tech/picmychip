import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { groupCategoriesForMenu } from '@/utilities/categoryMenuGroups'
import { getCategoryTreeSafe } from '@/utilities/getCategoryTree'
import { getCachedGlobal } from '@/utilities/getGlobals'

import './index.css'
import { HeaderClient } from './index.client'

const CATEGORY_URL_PATTERN = /^\/category\/([^/?#]+)\/?$/

export async function Header() {
  const payload = await getPayload({ config: configPromise })

  const [header, siteSettings, categoryTree] = await Promise.all([
    getCachedGlobal('header', 1)(),
    getCachedGlobal('site-settings', 1)(),
    getCategoryTreeSafe(payload),
  ])

  const navItems = (header?.navItems ?? []).map((item) => {
    if (item.children?.length) return item

    const categorySlug = item.link?.url?.match(CATEGORY_URL_PATTERN)?.[1]
    const categoryChildren = categorySlug ? categoryTree.childrenBySlug.get(categorySlug) : undefined
    if (!categoryChildren?.length) return item

    return {
      ...item,
      children: categoryChildren.map((child) => ({
        id: child.id,
        link: { type: 'custom' as const, label: child.title, newTab: false, url: `/category/${child.slug}` },
      })),
    }
  })

  return (
    <HeaderClient
      header={{ ...header, navItems }}
      shopCategoryGroups={groupCategoriesForMenu(categoryTree.topLevel)}
      siteSettings={siteSettings}
    />
  )
}
