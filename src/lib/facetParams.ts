import type { FacetDef } from '@/lib/facetConfig'
import type { FacetFilterValue } from '@/lib/searchProducts'

type SearchParamsRecord = { [key: string]: string | string[] | undefined }

/** Short, URL-friendly param name derived from a facet's dotted attribute path. */
export const facetKey = (attribute: string): string => attribute.split('.').pop() ?? attribute

export const parseFacetFilters = (
  searchParams: SearchParamsRecord,
  facets: FacetDef[],
): Record<string, FacetFilterValue> => {
  const result: Record<string, FacetFilterValue> = {}

  for (const facet of facets) {
    const key = facetKey(facet.attribute)

    if (facet.type === 'range') {
      const minRaw = searchParams[`${key}_min`]
      const maxRaw = searchParams[`${key}_max`]
      const min = minRaw ? Number(Array.isArray(minRaw) ? minRaw[0] : minRaw) : undefined
      const max = maxRaw ? Number(Array.isArray(maxRaw) ? maxRaw[0] : maxRaw) : undefined

      if (min !== undefined && !Number.isNaN(min)) {
        result[facet.attribute] = { ...(result[facet.attribute] as any), type: 'range', min }
      }
      if (max !== undefined && !Number.isNaN(max)) {
        result[facet.attribute] = { ...(result[facet.attribute] as any), type: 'range', max }
      }
    } else {
      const raw = searchParams[key]
      const values = (Array.isArray(raw) ? raw : raw?.split(',')) ?? []
      const filtered = values.filter(Boolean)

      if (filtered.length > 0) {
        result[facet.attribute] = { type: 'select', values: filtered }
      }
    }
  }

  return result
}
