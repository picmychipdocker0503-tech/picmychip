import type { Payload } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sendMarketingEmail, sendTransactionalEmail } from '@/lib/email/emailService'
import { buildZeptoMailAuthHeader } from '@/lib/email/providers/zeptomail'

const jsonResponse = (body: unknown, ok = true, status = ok ? 200 : 400) =>
  ({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response

/** In-memory stand-in for the email-events collection + logger, enough for emailService's needs. */
function fakePayload() {
  const events: Record<string, unknown>[] = []
  let nextId = 1

  const payload = {
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
    find: vi.fn(async ({ where }: { where: { emailEventId: { equals: string } } }) => {
      const match = events.find((e) => e.emailEventId === where.emailEventId.equals)
      return { docs: match ? [match] : [] }
    }),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const doc = { id: nextId++, ...data }
      events.push(doc)
      return doc
    }),
    update: vi.fn(async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const doc = events.find((e) => e.id === id)
      Object.assign(doc!, data)
      return doc
    }),
  }

  return { payload: payload as unknown as Payload, events }
}

describe('buildZeptoMailAuthHeader', () => {
  it('prepends the scheme to a bare token', () => {
    expect(buildZeptoMailAuthHeader('abc123')).toBe('Zoho-enczapikey abc123')
  })

  it('leaves an already-prefixed value as-is (case-insensitive)', () => {
    expect(buildZeptoMailAuthHeader('Zoho-enczapikey abc123')).toBe('Zoho-enczapikey abc123')
    expect(buildZeptoMailAuthHeader('zoho-enczapikey abc123')).toBe('zoho-enczapikey abc123')
  })
})

describe('sendTransactionalEmail (mocked fetch)', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.BREVO_API_KEY = 'test-brevo-key'
    process.env.ZEPTOMAIL_SEND_MAIL_TOKEN = 'test-zepto-token'
    process.env.EMAIL_FROM_ADDRESS = 'no-reply@test.com'
    process.env.EMAIL_FROM_NAME = 'Test'
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  // emailService caches providers at module scope on first use — resetModules
  // per test (combined with re-importing) keeps env var changes (like a
  // missing ZEPTOMAIL token) actually taking effect per test.
  const freshEmailService = async () => {
    const mod = await import('@/lib/email/emailService')
    return mod
  }

  it('Brevo success — no ZeptoMail call, fallbackUsed:false', async () => {
    const fetchSpy = vi.fn(async () => jsonResponse({ messageId: 'brevo-msg-1' }))
    vi.stubGlobal('fetch', fetchSpy)
    const { payload } = fakePayload()
    const { sendTransactionalEmail } = await freshEmailService()

    const result = await sendTransactionalEmail(payload, {
      eventId: 'TEST_1',
      emailType: 'TEST',
      to: 'a@example.com',
      subject: 'Hi',
      html: '<p>hi</p>',
    })

    expect(result).toEqual({ success: true, provider: 'BREVO', fallbackUsed: false, messageId: 'brevo-msg-1' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('Brevo permanent (4xx) failure — falls back to ZeptoMail, succeeds', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (url.includes('brevo.com')) return jsonResponse({ message: 'bad request' }, false, 400)
      if (url.includes('zeptomail.in')) return jsonResponse({ data: [{ message_id: 'zepto-msg-1' }] })
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchSpy)
    const { payload } = fakePayload()
    const { sendTransactionalEmail } = await freshEmailService()

    const result = await sendTransactionalEmail(payload, {
      eventId: 'TEST_2',
      emailType: 'TEST',
      to: 'a@example.com',
      subject: 'Hi',
      html: '<p>hi</p>',
    })

    expect(result).toEqual({ success: true, provider: 'ZEPTOMAIL', fallbackUsed: true, messageId: 'zepto-msg-1' })
    // Permanent failure — no retry, exactly one Brevo call before falling back.
    expect(fetchSpy.mock.calls.filter((c) => c[0].includes('brevo.com'))).toHaveLength(1)
  })

  it('Brevo temporary (5xx) failure — retries with backoff, then falls back to ZeptoMail', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (url.includes('brevo.com')) return jsonResponse({ message: 'server error' }, false, 500)
      if (url.includes('zeptomail.in')) return jsonResponse({ data: [{ message_id: 'zepto-msg-2' }] })
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchSpy)
    const { payload } = fakePayload()
    const { sendTransactionalEmail } = await freshEmailService()

    const promise = sendTransactionalEmail(payload, {
      eventId: 'TEST_3',
      emailType: 'TEST',
      to: 'a@example.com',
      subject: 'Hi',
      html: '<p>hi</p>',
    })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual({ success: true, provider: 'ZEPTOMAIL', fallbackUsed: true, messageId: 'zepto-msg-2' })
    // 3 total Brevo attempts (1 initial + 2 retries) before falling back.
    expect(fetchSpy.mock.calls.filter((c) => c[0].includes('brevo.com'))).toHaveLength(3)
  })

  it('Brevo ambiguous (timeout/network error) — retries, but never auto-falls-back, even after retries are exhausted', async () => {
    const fetchSpy = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })
    vi.stubGlobal('fetch', fetchSpy)
    const { payload } = fakePayload()
    const { sendTransactionalEmail } = await freshEmailService()

    const promise = sendTransactionalEmail(payload, {
      eventId: 'TEST_4',
      emailType: 'TEST',
      to: 'a@example.com',
      subject: 'Hi',
      html: '<p>hi</p>',
    })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.success).toBe(false)
    expect(result).toMatchObject({ provider: null, fallbackUsed: false })
    expect((result as { error: string }).error).toMatch(/unknown/i)
    // Retried Brevo 3 times total, but ZeptoMail was never touched.
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('both providers fail — status failed, both errors surfaced, consistent shape', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (url.includes('brevo.com')) return jsonResponse({ message: 'bad request' }, false, 400)
      if (url.includes('zeptomail.in')) return jsonResponse({ message: 'invalid recipient' }, false, 400)
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchSpy)
    const { payload, events } = fakePayload()
    const { sendTransactionalEmail } = await freshEmailService()

    const result = await sendTransactionalEmail(payload, {
      eventId: 'TEST_5',
      emailType: 'TEST',
      to: 'a@example.com',
      subject: 'Hi',
      html: '<p>hi</p>',
    })

    expect(result).toEqual({
      success: false,
      provider: null,
      fallbackUsed: true,
      messageId: null,
      error: 'Both Brevo and ZeptoMail failed',
    })
    expect(events[0]).toMatchObject({ status: 'failed', primaryProvider: 'brevo', fallbackProvider: 'zeptomail' })
  })

  it('idempotency — a second call with the same eventId after a successful send short-circuits, no new network calls', async () => {
    const fetchSpy = vi.fn(async () => jsonResponse({ messageId: 'brevo-msg-3' }))
    vi.stubGlobal('fetch', fetchSpy)
    const { payload } = fakePayload()
    const { sendTransactionalEmail } = await freshEmailService()

    const args = { eventId: 'TEST_6', emailType: 'TEST', to: 'a@example.com', subject: 'Hi', html: '<p>hi</p>' }
    const first = await sendTransactionalEmail(payload, args)
    const second = await sendTransactionalEmail(payload, args)

    expect(first).toEqual({ success: true, provider: 'BREVO', fallbackUsed: false, messageId: 'brevo-msg-3' })
    expect(second).toEqual(first)
    expect(fetchSpy).toHaveBeenCalledTimes(1) // not called again for the second call
  })

  it('never logs the raw API key or Authorization header', async () => {
    const fetchSpy = vi.fn(async () => jsonResponse({ messageId: 'brevo-msg-4' }))
    vi.stubGlobal('fetch', fetchSpy)
    const { payload } = fakePayload()
    const { sendTransactionalEmail } = await freshEmailService()

    await sendTransactionalEmail(payload, {
      eventId: 'TEST_7',
      emailType: 'TEST',
      to: 'a@example.com',
      subject: 'Hi',
      html: '<p>hi</p>',
    })

    const allLogCalls = [
      ...(payload.logger.info as ReturnType<typeof vi.fn>).mock.calls,
      ...(payload.logger.error as ReturnType<typeof vi.fn>).mock.calls,
    ]
    const serialized = JSON.stringify(allLogCalls)
    expect(serialized).not.toContain('test-brevo-key')
    expect(serialized).not.toContain('test-zepto-token')
    expect(serialized.toLowerCase()).not.toContain('authorization')
  })
})

describe('sendMarketingEmail', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.BREVO_API_KEY = 'test-brevo-key'
    process.env.ZEPTOMAIL_SEND_MAIL_TOKEN = 'test-zepto-token'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  it('never calls ZeptoMail, even when Brevo fails', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (url.includes('brevo.com')) return jsonResponse({ message: 'down' }, false, 500)
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchSpy)
    const { sendMarketingEmail } = await import('@/lib/email/emailService')

    const result = await sendMarketingEmail({ to: 'a@example.com', subject: 'Newsletter', html: '<p>hi</p>' })

    expect(result.success).toBe(false)
    expect(fetchSpy.mock.calls.every((c) => c[0].includes('brevo.com'))).toBe(true)
  })
})
