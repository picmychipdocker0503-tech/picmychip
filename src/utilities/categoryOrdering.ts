type CategoryLike = {
  slug?: string | null
  title?: string | null
}

const CATEGORY_SEQUENCE_SLUGS = [
  'drone-parts',
  'connectors',
  'modules',
  'cables',
  'cooling-fans-filters-and-grills',
  'fans-and-accessories',
  'fan-accessories',
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
  'hand-tools-and-consumables',
  'hand-tools-consumables',
  'tools-and-consumables',
  'nuts-and-screws',
  'brass',
  'nylon',
  'nylon-with-brass',
  'fasteners',
  'ac-dc-power-supply',
  'a-c-d-c-power-supply',
  'power-supply',
  'rd-tools',
  'r-and-d-tools',
  'research-and-development-tools',
]

const CATEGORY_SEQUENCE_TITLES = [
  'drone parts',
  'connectors',
  'modules',
  'cables',
  'fans and accessories',
  "fan's and accessories",
  'cooling fans filters and grills',
  'cooling fans, filters & grills',
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
  'hand tools and consumables',
  'nuts and screws',
  'studs and spacers',
  'nylon',
  'nylon with brass',
  'fasteners',
  'a/c - d/c power supply',
  'a/c-d/c power supply',
  'ac dc power supply',
  'power supply',
  'r&d tools',
  'r and d tools',
]

const normalize = (value?: string | null): string =>
  (value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const slugOrder = new Map(CATEGORY_SEQUENCE_SLUGS.map((slug, index) => [slug, index]))
const titleOrder = new Map(CATEGORY_SEQUENCE_TITLES.map((title, index) => [normalize(title), index]))

export function getCategorySequence(category: CategoryLike): number {
  const slugRank = category.slug ? slugOrder.get(category.slug) : undefined
  if (typeof slugRank === 'number') return slugRank

  const titleRank = titleOrder.get(normalize(category.title))
  if (typeof titleRank === 'number') return titleRank

  return CATEGORY_SEQUENCE_SLUGS.length + 100
}

export function sortCategoriesBySequence<T extends CategoryLike>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const rankDiff = getCategorySequence(a) - getCategorySequence(b)
    if (rankDiff !== 0) return rankDiff
    return (a.title || '').localeCompare(b.title || '')
  })
}
