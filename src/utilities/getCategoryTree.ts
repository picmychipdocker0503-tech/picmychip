import type { Payload } from 'payload'

export type CategoryTreeNode = {
  id: string
  title: string
  slug: string
  sequence: number
  children: CategoryTreeNode[]
}

export type CategoryTree = {
  /** Top-level categories (no parent), each with its direct subcategories nested in. */
  topLevel: CategoryTreeNode[]
  /** Direct-children lookup by category slug, for nav items that link straight to a category. */
  childrenBySlug: Map<string, CategoryTreeNode[]>
}

const EMPTY_TREE: CategoryTree = { topLevel: [], childrenBySlug: new Map() }

const sortTreeNodes = (nodes: CategoryTreeNode[]): CategoryTreeNode[] =>
  [...nodes].sort((a, b) => {
    const sequenceDiff = a.sequence - b.sequence
    if (sequenceDiff !== 0) return sequenceDiff
    return a.title.localeCompare(b.title)
  })

/**
 * Categories carry a self-referencing `parent` field (see Categories collection),
 * but nothing previously queried it downward — only breadcrumbs walk it upward.
 * This does a single flat fetch and builds the parent -> children tree in memory,
 * so both the header's "Shop" mega-menu and any per-category nav dropdown can
 * derive their subcategory lists from real catalog data instead of hand-curation.
 */
export const getCategoryTree = async (payload: Payload): Promise<CategoryTree> => {
  const { docs: categories } = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 0,
    pagination: false,
    select: { title: true, slug: true, parent: true, sequence: true },
    sort: 'sequence',
  })

  const nodesById = new Map<string, CategoryTreeNode>()
  for (const category of categories) {
    if (!category.slug) continue
    nodesById.set(String(category.id), {
      id: String(category.id),
      title: category.title,
      slug: category.slug,
      sequence: category.sequence ?? 1000,
      children: [],
    })
  }

  const topLevel: CategoryTreeNode[] = []
  const childrenBySlug = new Map<string, CategoryTreeNode[]>()

  for (const category of categories) {
    const node = nodesById.get(String(category.id))
    if (!node) continue

    const parentId = category.parent
      ? String(typeof category.parent === 'object' ? category.parent.id : category.parent)
      : null
    const parentNode = parentId ? nodesById.get(parentId) : undefined

    if (parentNode) {
      parentNode.children.push(node)
    } else {
      topLevel.push(node)
    }
  }

  for (const node of nodesById.values()) {
    node.children = sortTreeNodes(node.children)
    childrenBySlug.set(node.slug, node.children)
  }

  return { topLevel: sortTreeNodes(topLevel), childrenBySlug }
}

export const getCategoryTreeSafe = async (payload: Payload): Promise<CategoryTree> => {
  try {
    return await getCategoryTree(payload)
  } catch {
    return EMPTY_TREE
  }
}
