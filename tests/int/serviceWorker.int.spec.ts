import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resolveAppVersion, stampServiceWorker } from '../../scripts/stampServiceWorker'

describe('resolveAppVersion', () => {
  it('prefers RENDER_GIT_COMMIT (the actual deploy target)', () => {
    expect(
      resolveAppVersion({ RENDER_GIT_COMMIT: 'abcdef1234567890', VERCEL_GIT_COMMIT_SHA: 'other' }),
    ).toBe('abcdef123456')
  })

  it('falls back through Vercel, then generic CI env vars', () => {
    expect(resolveAppVersion({ VERCEL_GIT_COMMIT_SHA: 'deadbeef0000111122223333' })).toBe('deadbeef0000')
    expect(resolveAppVersion({ SOURCE_VERSION: 'cafebabe0000111122223333' })).toBe('cafebabe0000')
    expect(resolveAppVersion({ GIT_COMMIT: 'feedface0000111122223333' })).toBe('feedface0000')
    expect(resolveAppVersion({ COMMIT_SHA: '1234567890abcdef' })).toBe('1234567890ab')
  })

  it('truncates to 12 characters — a short, cache-name-safe identifier', () => {
    const version = resolveAppVersion({ RENDER_GIT_COMMIT: 'a'.repeat(40) })
    expect(version).toHaveLength(12)
  })

  it('falls back to a timestamp-based dev version when nothing is set', () => {
    const version = resolveAppVersion({})
    expect(version).toMatch(/^dev-\d+$/)
  })
})

describe('stampServiceWorker', () => {
  let dir: string
  let swPath: string

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'sw-stamp-test-'))
    swPath = path.join(dir, 'sw.js')
    writeFileSync(swPath, "const CACHE_NAME = 'Picmychip-static-__SW_VERSION__'\n")
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('replaces every occurrence of the placeholder with the resolved version', () => {
    stampServiceWorker(swPath, 'abc123def456')
    const contents = readFileSync(swPath, 'utf8')
    expect(contents).toContain("CACHE_NAME = 'Picmychip-static-abc123def456'")
    expect(contents).not.toContain('__SW_VERSION__')
  })

  it('throws instead of silently no-op-ing when the placeholder is already gone (double-stamp guard)', () => {
    stampServiceWorker(swPath, 'abc123def456')
    expect(() => stampServiceWorker(swPath, 'someothersha')).toThrow(/already been stamped/)
  })
})
