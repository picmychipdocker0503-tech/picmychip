import { describe, expect, it } from 'vitest'

import { emptyCandidateFields, scoreCandidateForQuery } from '@/lib/searchProducts'
import { flattenToSearchText } from '@/lib/searchText'

// Mirrors this repo's DB-fallback search — every query below matched
// nothing before relevance ranking was added (results existed but were
// buried past the default page size by pure alphabetical sort).
const handCrimper = () => ({
  ...emptyCandidateFields(),
  title: 'hand crimper tool rectangular contacts',
})

// "Configuration: SMA Male to SMA Female" on an "RG405 Cable" — this catalog
// has no dedicated configuration field, so configuration values live in the
// category-spec ("specs") group, flattened the same way toSearchDocument
// does for Meilisearch.
// searchViaDatabase always lowercases every field before scoring (see
// loadCandidatePool) — mirrored here since this fixture builds fields
// directly rather than going through that function.
const rg405Cable = () => ({
  ...emptyCandidateFields(),
  title: 'rg405 cable',
  specs: flattenToSearchText({
    connectorType: 'sma-male',
    connectorTypeOther: 'SMA Male to SMA Female',
  }).toLowerCase(),
})

const isAllWordMatch = (fields: ReturnType<typeof emptyCandidateFields>, query: string) => {
  const wordCount = query.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean).length
  const { matchedWordCount, score } = scoreCandidateForQuery(fields, query)
  return matchedWordCount === wordCount && score > 0
}

describe('scoreCandidateForQuery — product title matching', () => {
  it.each([
    'Hand Crimper',
    'crimper',
    'Rectangular',
    'Contacts',
    'Hand',
    'hand crimper tool',
    'rectangular crimper', // out of title-word order
    'HAND CRIMPER',
    'hand crimper',
    'Crimper Tool Rectangular Contacts',
  ])('matches "%s" against "Hand Crimper Tool Rectangular Contacts"', (query) => {
    expect(isAllWordMatch(handCrimper(), query)).toBe(true)
  })

  it('is case-insensitive — same match result regardless of casing', () => {
    const a = scoreCandidateForQuery(handCrimper(), 'Hand Crimper')
    const b = scoreCandidateForQuery(handCrimper(), 'hand crimper')
    const c = scoreCandidateForQuery(handCrimper(), 'HAND CRIMPER')
    expect(a.matchedWordCount).toBe(2)
    expect(b.matchedWordCount).toBe(2)
    expect(c.matchedWordCount).toBe(2)
  })

  it('ignores repeated/extra whitespace', () => {
    const tight = scoreCandidateForQuery(handCrimper(), 'hand crimper')
    const spaced = scoreCandidateForQuery(handCrimper(), '  hand   crimper  ')
    expect(spaced.matchedWordCount).toBe(tight.matchedWordCount)
    expect(spaced.score).toBeCloseTo(tight.score, 5)
  })

  it('does not match an unrelated query', () => {
    expect(isAllWordMatch(handCrimper(), 'raspberry pi')).toBe(false)
  })
})

describe('scoreCandidateForQuery — configuration/spec values (RG405 Cable example)', () => {
  it.each(['SMA Male', 'SMA Female', 'SMA', 'RG405 SMA', 'Male Female', 'SMA cable'])(
    'matches "%s" via the flattened configuration/specs field',
    (query) => {
      expect(isAllWordMatch(rg405Cable(), query)).toBe(true)
    },
  )
})

describe('scoreCandidateForQuery — SKU / part number', () => {
  it('matches on an exact SKU', () => {
    const fields = { ...emptyCandidateFields(), title: 'crimper tool', sku: 'crimp-1001-rect' }
    expect(isAllWordMatch(fields, 'crimp-1001-rect')).toBe(true)
  })

  it('matches on a partial SKU', () => {
    const fields = { ...emptyCandidateFields(), title: 'crimper tool', sku: 'crimp-1001-rect' }
    expect(isAllWordMatch(fields, '1001')).toBe(true)
  })
})

describe('scoreCandidateForQuery — relevance weighting', () => {
  it('ranks a title match above a description-only match for the same word', () => {
    const titleMatch = { ...emptyCandidateFields(), title: 'crimper tool' }
    const descriptionOnlyMatch = { ...emptyCandidateFields(), title: 'unrelated widget', description: 'works with a crimper' }

    const titleScore = scoreCandidateForQuery(titleMatch, 'crimper').score
    const descriptionScore = scoreCandidateForQuery(descriptionOnlyMatch, 'crimper').score

    expect(titleScore).toBeGreaterThan(descriptionScore)
  })

  it('an all-keyword match scores higher matchedWordCount than a partial match', () => {
    const full = handCrimper()
    const partial = { ...emptyCandidateFields(), title: 'hand tool' } // missing "crimper"

    const fullResult = scoreCandidateForQuery(full, 'hand crimper')
    const partialResult = scoreCandidateForQuery(partial, 'hand crimper')

    expect(fullResult.matchedWordCount).toBe(2)
    expect(partialResult.matchedWordCount).toBe(1)
  })
})

describe('flattenToSearchText', () => {
  it('flattens nested spec groups into a space-separated string', () => {
    const text = flattenToSearchText({
      material: 'carbon-fiber',
      dimensions: { lengthMM: 10, widthMM: 5 },
    })
    expect(text).toContain('carbon fiber')
  })

  it('drops numbers and booleans, keeps strings', () => {
    const text = flattenToSearchText({ count: 5, enabled: true, label: 'connector' })
    expect(text.trim()).toBe('connector')
  })

  it('returns an empty string for null/undefined', () => {
    expect(flattenToSearchText(null)).toBe('')
    expect(flattenToSearchText(undefined)).toBe('')
  })
})
