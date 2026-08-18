/**
 * Recursively flattens an arbitrarily-nested value (built for the Products
 * `specs` group — selects, "other" free-text overrides, nested dimension
 * groups) into one space-separated search string. Numbers/booleans are
 * dropped (not meaningful as keyword search terms); select values are
 * hyphen/underscore-slugs ("carbon-fiber") humanized to how a shopper would
 * actually type them ("carbon fiber").
 */
export const flattenToSearchText = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed.replace(/[-_]+/g, ' ') : ''
  }
  if (typeof value === 'number' || typeof value === 'boolean') return ''
  if (Array.isArray(value)) return value.map(flattenToSearchText).filter(Boolean).join(' ')
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(flattenToSearchText)
      .filter(Boolean)
      .join(' ')
  }
  return ''
}
