import crypto from 'crypto'

// Long enough to survive the Google consent screen, short enough that a
// leaked/logged `state` value isn't useful for long.
const MAX_AGE_MS = 10 * 60 * 1000

/** Only same-site relative paths — blocks `//evil.com` and absolute URLs so the signed state can't be used as an open redirect. */
function isSafeRedirect(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
}

function sign(encodedPayload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')
}

function signaturesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Builds a stateless, HMAC-signed `state` param carrying the post-login
 * redirect target — avoids needing server-side storage between the
 * `/oauth/google` redirect and the `/oauth/google/callback` request, while
 * still protecting against CSRF and state tampering.
 */
export function createOAuthState(secret: string, redirectTo: string): string {
  const payload = JSON.stringify({
    n: crypto.randomBytes(8).toString('hex'),
    r: isSafeRedirect(redirectTo) ? redirectTo : '/account',
    t: Date.now(),
  })
  const encoded = Buffer.from(payload).toString('base64url')
  return `${encoded}.${sign(encoded, secret)}`
}

export function verifyOAuthState(secret: string, state: string | null): { redirectTo: string } | null {
  if (!state) return null

  const [encoded, signature] = state.split('.')
  if (!encoded || !signature || !signaturesMatch(sign(encoded, secret), signature)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (typeof payload.t !== 'number' || Date.now() - payload.t > MAX_AGE_MS) return null
    if (typeof payload.r !== 'string' || !isSafeRedirect(payload.r)) return null
    return { redirectTo: payload.r }
  } catch {
    return null
  }
}
