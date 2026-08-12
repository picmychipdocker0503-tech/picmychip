import type { CategoryTreeNode } from './getCategoryTree'

export type CategoryMenuGroup = {
  heading: string
  categories: CategoryTreeNode[]
}

// Hand-curated grouping for the header's "Shop" mega-menu — the catalog's
// top-level categories are a flat, unordered list with no grouping metadata
// of their own, so this is presentation-only and keyed by slug. Anything not
// listed here (new categories added later) still shows up, under "More".
// Groups with expandable (has-subcategory) items are listed first, so the
// categories worth hovering for a flyout are the ones a visitor sees first.
const GROUPS: { heading: string; slugs: string[] }[] = [
  { heading: 'Connectors & Cables', slugs: ['connectors', 'cables'] },
  {
    heading: 'Components',
    slugs: [
      'resistor',
      'capacitor',
      'inductor',
      'diode',
      'transistor',
      'ic',
      'led',
      'buzzer',
      'switch',
      'fuse',
      'components',
    ],
  },
  { heading: 'Hardware & Materials', slugs: ['nuts-and-screws', 'brass', 'nylon', 'nylon-with-brass'] },
  { heading: 'Drone & Cooling', slugs: ['drone-parts', 'cooling-fans-filters-and-grills'] },
]

// Within a group, categories with subcategories sort above plain leaf
// categories, so the expandable ones are immediately visible.
const byHasChildrenFirst = (a: CategoryTreeNode, b: CategoryTreeNode): number =>
  Number(b.children.length > 0) - Number(a.children.length > 0)

// A stray "Shop" category would otherwise render as "Shop > Shop" inside its
// own trigger menu — not a real browsable section, so drop it here.
const EXCLUDED_SLUGS = new Set(['shop'])

export const groupCategoriesForMenu = (categories: CategoryTreeNode[]): CategoryMenuGroup[] => {
  const remaining = new Map(
    categories.filter((category) => !EXCLUDED_SLUGS.has(category.slug)).map((category) => [category.slug, category]),
  )

  const groups: CategoryMenuGroup[] = []

  for (const { heading, slugs } of GROUPS) {
    const matched = slugs
      .map((slug) => remaining.get(slug))
      .filter((category): category is CategoryTreeNode => Boolean(category))

    matched.forEach((category) => remaining.delete(category.slug))
    if (matched.length) groups.push({ heading, categories: matched.sort(byHasChildrenFirst) })
  }

  if (remaining.size) {
    groups.push({ heading: 'More', categories: Array.from(remaining.values()).sort(byHasChildrenFirst) })
  }

  return groups
}
