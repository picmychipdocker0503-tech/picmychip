import type { Payload } from 'payload'

import { createBrevoProvider } from './providers/brevo'
import { createZeptoMailProvider } from './providers/zeptomail'
import {
  EmailProviderError,
  type EmailProvider,
  type EmailSendArgs,
  type SendTransactionalEmailArgs,
  type SendTransactionalEmailResult,
  type TransactionalEmailStatus,
} from './types'

const RETRY_BACKOFF_MS = [500, 1500]
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let cachedProviders: { brevo: EmailProvider; zeptomail: EmailProvider | null } | null = null

/**
 * Lazily builds both providers from env vars once per process — mirrors how
 * the Payload-configured Brevo adapter was already wired (built once at
 * config-load time). ZeptoMail is optional: if unconfigured, transactional
 * email still works Brevo-only, it just can't fall back.
 */
function getProviders(): { brevo: EmailProvider; zeptomail: EmailProvider | null } {
  if (cachedProviders) return cachedProviders

  const brevoApiKey = process.env.BREVO_API_KEY
  if (!brevoApiKey) {
    throw new Error('BREVO_API_KEY is not set — transactional email cannot be sent.')
  }

  const defaultFromAddress = process.env.EMAIL_FROM_ADDRESS || 'no-reply@picmychip.com'
  const defaultFromName = process.env.EMAIL_FROM_NAME || 'Picmychip'

  const brevo = createBrevoProvider({ apiKey: brevoApiKey, defaultFromAddress, defaultFromName })

  // .env may have either the spec's suggested ZEPTOMAIL_SEND_MAIL_TOKEN, or
  // (as this project's actually does) ZEPTOMAIL_API_KEY with the
  // "Zoho-enczapikey " scheme prefix already baked in — both work, see
  // buildZeptoMailAuthHeader.
  const zeptoToken = process.env.ZEPTOMAIL_SEND_MAIL_TOKEN || process.env.ZEPTOMAIL_API_KEY
  const zeptomail = zeptoToken
    ? createZeptoMailProvider({
        token: zeptoToken,
        defaultFromAddress: process.env.ZEPTOMAIL_SENDER_EMAIL || defaultFromAddress,
        defaultFromName: process.env.ZEPTOMAIL_SENDER_NAME || defaultFromName,
        apiUrl: process.env.ZEPTOMAIL_API_URL || undefined,
      })
    : null

  cachedProviders = { brevo, zeptomail }
  return cachedProviders
}

type LogFields = {
  eventId: string
  emailType: string
  recipient: string
  provider: 'BREVO' | 'ZEPTOMAIL'
  attempt: number
  status: 'SUCCESS' | 'FAILED'
  httpStatus?: number
  providerMessageId?: string
  fallbackUsed: boolean
  error?: string
}

// Structured, one line per attempt — deliberately only ever logs fields
// listed here. Never pass headers, tokens, or raw request/response bodies
// into this function.
function logEmailAttempt(payload: Payload, fields: LogFields): void {
  const line = {
    emailEventId: fields.eventId,
    emailType: fields.emailType,
    recipient: fields.recipient,
    provider: fields.provider,
    attempt: fields.attempt,
    status: fields.status,
    httpStatus: fields.httpStatus,
    providerMessageId: fields.providerMessageId,
    fallbackUsed: fields.fallbackUsed,
    error: fields.error,
    timestamp: new Date().toISOString(),
  }
  if (fields.status === 'SUCCESS') payload.logger.info(line)
  else payload.logger.error(line)
}

async function findEmailEvent(payload: Payload, eventId: string) {
  const { docs } = await payload.find({
    collection: 'email-events',
    where: { emailEventId: { equals: eventId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0]
}

async function upsertEmailEvent(
  payload: Payload,
  args: {
    eventId: string
    emailType: string
    recipient: string
    status: TransactionalEmailStatus
    primaryProvider?: string
    fallbackProvider?: string
    providerMessageId?: string
    attemptCount: number
    errorMessage?: string
  },
): Promise<void> {
  const existing = await findEmailEvent(payload, args.eventId)
  const data = {
    emailEventId: args.eventId,
    emailType: args.emailType,
    recipient: args.recipient,
    status: args.status,
    primaryProvider: args.primaryProvider,
    fallbackProvider: args.fallbackProvider,
    providerMessageId: args.providerMessageId,
    attemptCount: args.attemptCount,
    errorMessage: args.errorMessage?.slice(0, 500),
  }

  if (existing) {
    await payload.update({ collection: 'email-events', id: existing.id, data, overrideAccess: true })
  } else {
    await payload.create({ collection: 'email-events', data, overrideAccess: true })
  }
}

type AttemptOutcome =
  | { success: true; messageId?: string; attempts: number; httpStatus?: number }
  | { success: false; error: EmailProviderError; attempts: number }

/**
 * Up to 1 initial attempt + 2 retries (3 total), exponential backoff.
 * Retries on `temporary`/`ambiguous`; stops immediately on success or a
 * `permanent` failure (retrying invalid-recipient/invalid-request errors
 * never helps).
 */
async function sendWithRetry(
  provider: EmailProvider,
  args: EmailSendArgs,
  onAttempt: (attempt: number, outcome: 'SUCCESS' | 'FAILED', err?: EmailProviderError, messageId?: string) => void,
): Promise<AttemptOutcome> {
  let lastError: EmailProviderError | undefined
  const maxAttempts = 1 + RETRY_BACKOFF_MS.length

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await provider.send(args)
      onAttempt(attempt, 'SUCCESS', undefined, result.messageId)
      return { success: true, messageId: result.messageId, attempts: attempt }
    } catch (err) {
      const providerError =
        err instanceof EmailProviderError ? err : new EmailProviderError(String(err), 'ambiguous')
      lastError = providerError
      onAttempt(attempt, 'FAILED', providerError)

      if (providerError.kind === 'permanent') break
      if (attempt < maxAttempts) await sleep(RETRY_BACKOFF_MS[attempt - 1])
    }
  }

  return { success: false, error: lastError!, attempts: maxAttempts }
}

/**
 * The single entry point for every transactional email in the app (order
 * confirmation, invoices, shipping/delivery updates, password reset, OTP,
 * account verification, order/RFQ notifications, ...). Brevo is tried
 * first (with bounded retries); ZeptoMail is only used as a fallback when
 * Brevo has *definitively* failed (a real HTTP error response) — a genuine
 * timeout/network error is deliberately NOT treated as a confirmed failure,
 * since Brevo may have actually accepted the request, and auto-falling-back
 * on an ambiguous outcome risks sending the same email twice.
 */
export async function sendTransactionalEmail(
  payload: Payload,
  args: SendTransactionalEmailArgs,
): Promise<SendTransactionalEmailResult> {
  const { eventId, emailType, to, subject, html } = args

  const existing = await findEmailEvent(payload, eventId).catch(() => undefined)
  if (existing?.status === 'sent') {
    const fallbackUsed = Boolean(existing.fallbackProvider)
    return {
      success: true,
      provider: fallbackUsed ? 'ZEPTOMAIL' : 'BREVO',
      fallbackUsed,
      messageId: existing.providerMessageId || undefined,
    }
  }

  const providers = getProviders()
  const sendArgs: EmailSendArgs = { to, subject, html }
  let attemptCount = 0

  const brevoOutcome = await sendWithRetry(providers.brevo, sendArgs, (attempt, status, err, messageId) => {
    attemptCount = attempt
    logEmailAttempt(payload, {
      eventId,
      emailType,
      recipient: to,
      provider: 'BREVO',
      attempt,
      status,
      httpStatus: err?.statusCode,
      providerMessageId: messageId,
      fallbackUsed: false,
      error: err?.message,
    })
  })

  if (brevoOutcome.success) {
    await upsertEmailEvent(payload, {
      eventId,
      emailType,
      recipient: to,
      status: 'sent',
      primaryProvider: 'brevo',
      providerMessageId: brevoOutcome.messageId,
      attemptCount,
    })
    return { success: true, provider: 'BREVO', fallbackUsed: false, messageId: brevoOutcome.messageId }
  }

  const brevoError = brevoOutcome.error

  if (brevoError.kind === 'ambiguous') {
    await upsertEmailEvent(payload, {
      eventId,
      emailType,
      recipient: to,
      status: 'unknown',
      primaryProvider: 'brevo',
      attemptCount,
      errorMessage: brevoError.message,
    })
    return {
      success: false,
      provider: null,
      fallbackUsed: false,
      messageId: null,
      error:
        'Brevo delivery status unknown (timeout/network error, no response received) — not auto-retried via fallback to avoid a possible duplicate email.',
    }
  }

  // Definitive failure (Brevo responded with a real error, retries
  // exhausted) — safe to fall back.
  if (!providers.zeptomail) {
    await upsertEmailEvent(payload, {
      eventId,
      emailType,
      recipient: to,
      status: 'failed',
      primaryProvider: 'brevo',
      attemptCount,
      errorMessage: `${brevoError.message} (no fallback provider configured)`,
    })
    return { success: false, provider: null, fallbackUsed: false, messageId: null, error: 'Brevo failed and no fallback provider is configured.' }
  }

  attemptCount += 1
  try {
    const zeptoResult = await providers.zeptomail.send(sendArgs)
    logEmailAttempt(payload, {
      eventId,
      emailType,
      recipient: to,
      provider: 'ZEPTOMAIL',
      attempt: attemptCount,
      status: 'SUCCESS',
      providerMessageId: zeptoResult.messageId,
      fallbackUsed: true,
    })
    await upsertEmailEvent(payload, {
      eventId,
      emailType,
      recipient: to,
      status: 'sent',
      primaryProvider: 'brevo',
      fallbackProvider: 'zeptomail',
      providerMessageId: zeptoResult.messageId,
      attemptCount,
    })
    return { success: true, provider: 'ZEPTOMAIL', fallbackUsed: true, messageId: zeptoResult.messageId }
  } catch (err) {
    const zeptoError = err instanceof EmailProviderError ? err : new EmailProviderError(String(err), 'ambiguous')
    logEmailAttempt(payload, {
      eventId,
      emailType,
      recipient: to,
      provider: 'ZEPTOMAIL',
      attempt: attemptCount,
      status: 'FAILED',
      httpStatus: zeptoError.statusCode,
      fallbackUsed: true,
      error: zeptoError.message,
    })
    await upsertEmailEvent(payload, {
      eventId,
      emailType,
      recipient: to,
      status: 'failed',
      primaryProvider: 'brevo',
      fallbackProvider: 'zeptomail',
      attemptCount,
      errorMessage: `Brevo: ${brevoError.message} | ZeptoMail: ${zeptoError.message}`,
    })
    return { success: false, provider: null, fallbackUsed: true, messageId: null, error: 'Both Brevo and ZeptoMail failed' }
  }
}

/**
 * Marketing/promotional email (currently just the newsletter welcome) —
 * Brevo only, deliberately never falls back to ZeptoMail and isn't tracked
 * in EmailEvents (that idempotency store exists for the transactional
 * duplicate-send risk, which doesn't apply the same way here).
 */
export async function sendMarketingEmail(args: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const providers = getProviders()
  try {
    const result = await providers.brevo.send(args)
    return { success: true, messageId: result.messageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
