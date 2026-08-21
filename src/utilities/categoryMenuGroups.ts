import type { CategoryTreeNode } from './getCategoryTree'

import { sortCategoriesBySequence } from './categoryOrdering'

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
  { heading: 'Drone parts', slugs: ['drone-parts'] },
  { heading: 'Connectors', slugs: ['connectors'] },
  { heading: 'Modules', slugs: ['modules'] },
  { heading: 'Cables', slugs: ['cables'] },
  { heading: "Fan's and Accessories", slugs: ['cooling-fans-filters-and-grills', 'fans-and-accessories'] },
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
    ],
  },
  { heading: 'Hand Tools & Consumables', slugs: ['hand-tools-and-consumables', 'hand-tools-consumables'] },
  { heading: 'Fasteners', slugs: ['nuts-and-screws', 'brass', 'nylon', 'nylon-with-brass', 'fasteners'] },
  { heading: 'A/C - D/C Power supply', slugs: ['ac-dc-power-supply', 'a-c-d-c-power-supply', 'power-supply'] },
  { heading: 'R&D Tools', slugs: ['rd-tools', 'r-and-d-tools', 'research-and-development-tools'] },
]

// A stray "Shop" category would otherwise render as "Shop > Shop" inside its
// own trigger menu — not a real browsable section, so drop it here.
const EXCLUDED_SLUGS = new Set(['shop', 'components'])

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
    if (matched.length) groups.push({ heading, categories: sortCategoriesBySequence(matched) })
  }

  if (remaining.size) {
    groups.push({ heading: 'More', categories: sortCategoriesBySequence(Array.from(remaining.values())) })
  }

  return groups
}
