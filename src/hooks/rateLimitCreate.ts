import type { CollectionBeforeOperationHook } from 'payload'
import { APIError } from 'payload'

import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

/**
 * Rate-limits a collection's public `create` endpoint by IP — for anything
 * reachable without auth (or cheaply reachable with a throwaway account),
 * Payload's own access control has nothing to say about request *frequency*,
 * only whether a request is allowed at all. Throwing here surfaces as a
 * normal Payload API error response (400-ish), same as any validation error.
 */
export const rateLimitCreate = (
  bucket: string,
  limit: number,
  windowMs: number,
): CollectionBeforeOperationHook => {
  return ({ args, operation }) => {
    if (operation !== 'create') return args

    const ip = getClientIp(args.req.headers)
    const { allowed } = checkRateLimit(`${bucket}:${ip}`, limit, windowMs)

    if (!allowed) {
      throw new APIError('Too many requests. Please wait a moment and try again.', 429)
    }

    return args
  }
}
