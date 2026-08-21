import type { CategoryTreeNode } from './getCategoryTree'

export type CategoryMenuGroup = {
  heading: string
  categories: CategoryTreeNode[]
}

// A stray "Shop" category would otherwise render as "Shop > Shop" inside its
// own trigger menu — not a real browsable section, so drop it here.
const EXCLUDED_SLUGS = new Set(['shop'])

export const groupCategoriesForMenu = (categories: CategoryTreeNode[]): CategoryMenuGroup[] => {
  const visibleCategories = categories.filter((category) => !EXCLUDED_SLUGS.has(category.slug))

  return visibleCategories.length
    ? [
        {
          heading: 'Categories',
          categories: visibleCategories,
        },
      ]
    : []
}
