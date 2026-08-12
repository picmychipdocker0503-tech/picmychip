/**
 * In-memory fixed-window rate limiter — deliberately dependency-free (no
 * Redis/Upstash provisioned for this project). Good enough to blunt casual
 * abuse (coupon brute-forcing, newsletter/review spam bots, scraping the
 * search endpoint) on a single server instance.
 *
 * Known limitation: state is per warm process, not shared across instances.
 * If this app is ever deployed behind multiple concurrent serverless/edge
 * instances, each gets its own counter — meaningfully raises the bar over
 * no rate limiting, but isn't a hard cap in that topology. Swap the `hits`
 * Map for `@upstash/ratelimit` (or similar) at that point without touching
 * any call site — the `checkRateLimit` signature stays the same.
 */

type Entry = { count: number; resetAt: number }

const hits = new Map<string, Entry>()

// Without this, every unique key (IP × route) ever seen leaks forever.
// Sweeping periodically instead of on every call keeps the common path cheap.
const SWEEP_INTERVAL_MS = 5 * 60_000
let lastSweep = Date.now()

const sweep = (now: number) => {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key)
  }
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key Unique bucket identifier — typically `${route}:${ip}`.
 * @param limit Max requests allowed within the window.
 * @param windowMs Window length in milliseconds.
 */
export const checkRateLimit = (key: string, limit: number, windowMs: number): RateLimitResult => {
  const now = Date.now()
  sweep(now)

  const existing = hits.get(key)

  if (!existing || existing.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/** Best-effort client IP from standard proxy headers (Vercel/most CDNs set these). */
export const getClientIp = (headers: Headers): string =>
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  headers.get('x-real-ip') ||
  'unknown'
