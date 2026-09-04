const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'with', 'in', 'on', 'by', 'to', 'of',
  'at', 'is', 'it', 'as', 'be', 'from', 'that', 'this', 'are', 'was', 'were',
  'but', 'not', 'no', 'so', 'if', 'than', 'then', 'into', 'per', 'up', 'down',
])

/**
 * Extracts SEO keyword candidates from a product title — lowercased, stripped of
 * punctuation, with common stop words and single-character/pure-numeric tokens
 * removed. Also generates adjacent 2-word bigrams from the remaining tokens when
 * the original title has 3 or more words (a single word alone is often too
 * generic to be a useful term on its own). This is for internal search/filtering
 * and structured-data consistency — NOT a Google ranking signal.
 *
 * @example
 * extractKeywordsFromTitle('USB Fast Charging Cable 2024')
 * // => ['usb', 'fast', 'charging', 'cable', 'usb fast', 'fast charging', 'charging cable']
 */
export function extractKeywordsFromTitle(title: string): string[] {
  try {
    if (!title || typeof title !== 'string') return []

    const originalWordCount = title.trim().split(/\s+/).filter(Boolean).length
    if (originalWordCount === 0) return []

    const tokens = title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)

    const filtered = tokens.filter((token) => {
      if (token.length <= 1) return false
      if (/^\d+$/.test(token)) return false
      if (STOP_WORDS.has(token)) return false
      return true
    })

    const keywords: string[] = [...filtered]

    if (originalWordCount >= 3) {
      for (let i = 0; i < filtered.length - 1; i++) {
        keywords.push(`${filtered[i]} ${filtered[i + 1]}`)
      }
    }

    return Array.from(new Set(keywords))
  } catch (error) {
    console.error('[extractKeywordsFromTitle]', error)
    return []
  }
}
