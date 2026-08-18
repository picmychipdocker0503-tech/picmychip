import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const SW_PATH = path.resolve(dirname, '../public/sw.js')
const PLACEHOLDER = '__SW_VERSION__'

/**
 * Resolves a short, deploy-unique version string with no manual bumping
 * required — the deploy platform's own commit SHA when available (Render,
 * Vercel, and generic CI env vars, checked in that order), falling back to
 * a timestamp for local builds. Exported so this can be unit-tested without
 * touching the filesystem.
 */
export function resolveAppVersion(env: Partial<NodeJS.ProcessEnv> = process.env): string {
  const commitSha =
    env.RENDER_GIT_COMMIT || env.VERCEL_GIT_COMMIT_SHA || env.SOURCE_VERSION || env.GIT_COMMIT || env.COMMIT_SHA

  if (commitSha) return commitSha.slice(0, 12)
  return `dev-${Date.now()}`
}

/**
 * Stamps public/sw.js's CACHE_NAME placeholder with the resolved version —
 * run as part of `pnpm build` (before `next build`), never checked back
 * into git: each CI/deploy build works against a fresh checkout, so the
 * repo always keeps the literal placeholder.
 */
export function stampServiceWorker(swPath: string = SW_PATH, version: string = resolveAppVersion()): void {
  const source = readFileSync(swPath, 'utf8')

  if (!source.includes(PLACEHOLDER)) {
    throw new Error(`${PLACEHOLDER} not found in ${swPath} — has the service worker already been stamped?`)
  }

  writeFileSync(swPath, source.replaceAll(PLACEHOLDER, version))
}

// Only run when executed directly (`npx tsx scripts/stampServiceWorker.ts`), not when imported for its exports (tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const version = resolveAppVersion()
  stampServiceWorker(SW_PATH, version)
  console.log(`Stamped public/sw.js with version: ${version}`)
}
