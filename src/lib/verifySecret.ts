import { timingSafeEqual } from 'node:crypto'

/**
 * Constant-time shared-secret comparison for webhook/cron endpoints — a
 * plain `!==` leaks timing information a network attacker can use to guess
 * the secret byte-by-byte. Returns false (never throws) for any mismatch,
 * including a missing env var or a length mismatch.
 */
export const isValidSecret = (provided: string | null | undefined, expected: string | undefined): boolean => {
  if (!expected || !provided) return false

  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(provided)
  if (expectedBuf.length !== providedBuf.length) return false

  return timingSafeEqual(expectedBuf, providedBuf)
}
