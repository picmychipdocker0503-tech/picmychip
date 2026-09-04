import { describe, expect, it } from 'vitest'

import { extractKeywordsFromTitle } from '@/utilities/extractKeywordsFromTitle'

// Colocated with the project's other unit tests rather than as a *.test.ts file
// next to the source — vitest.config.mts only discovers `tests/int/**/*.int.spec.ts`,
// so a colocated file would never actually run.
describe('extractKeywordsFromTitle', () => {
  it('extracts unigrams and bigrams from a normal title', () => {
    expect(extractKeywordsFromTitle('USB Fast Charging Cable 2024')).toEqual([
      'usb',
      'fast',
      'charging',
      'cable',
      'usb fast',
      'fast charging',
      'charging cable',
    ])
  })

  it('strips punctuation and special characters', () => {
    expect(extractKeywordsFromTitle('Type-C, USB 3.0 Cable!!')).toEqual([
      'type',
      'usb',
      'cable',
      'type usb',
      'usb cable',
    ])
  })

  it('does not generate bigrams for a title under 3 words', () => {
    expect(extractKeywordsFromTitle('USB Cable')).toEqual(['usb', 'cable'])
  })

  it('returns an empty array for an empty string', () => {
    expect(extractKeywordsFromTitle('')).toEqual([])
  })

  it('returns an empty array when the title is entirely stop words', () => {
    expect(extractKeywordsFromTitle('for the with')).toEqual([])
  })
})
