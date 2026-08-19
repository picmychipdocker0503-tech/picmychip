// @vitest-environment node
// submitRfq is a server action (Node runtime, never jsdom/browser) — jsdom's
// File implementation is missing arrayBuffer() in this project's jsdom
// version, so the default environment can't exercise the file-attachment path.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sendTransactionalEmailMock = vi.fn()

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
  })),
}))
vi.mock('@/lib/email/emailService', () => ({
  sendTransactionalEmail: (...args: unknown[]) => sendTransactionalEmailMock(...args),
}))

const baseFields: Record<string, string> = {
  email: 'buyer@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  company: 'Analytical Engines Ltd',
  phone: '',
  message: '',
}

function buildFormData(overrides: Record<string, string> = {}, lineItems: unknown[] = [], file?: File) {
  const formData = new FormData()
  const fields = { ...baseFields, ...overrides }
  for (const [key, value] of Object.entries(fields)) formData.set(key, value)
  formData.set('lineItems', JSON.stringify(lineItems))
  if (file) formData.set('file', file)
  return formData
}

describe('submitRfq', () => {
  beforeEach(() => {
    sendTransactionalEmailMock.mockReset()
    sendTransactionalEmailMock.mockResolvedValue({ success: true, provider: 'BREVO', fallbackUsed: false })
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('rejects when required contact fields are missing', async () => {
    const { submitRfq } = await import('@/components/rfq/submitRfq')
    const result = await submitRfq(buildFormData({ company: '' }, [{ mpn: 'STM32F103C8T6' }]))

    expect(result).toEqual({ success: false, error: expect.stringContaining('name, company') })
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('rejects when there are no line items and no file', async () => {
    const { submitRfq } = await import('@/components/rfq/submitRfq')
    const result = await submitRfq(buildFormData({}, [{ mpn: '', manufacturer: '' }]))

    expect(result).toEqual({ success: false, error: expect.stringContaining('Add at least one part') })
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('filters out blank trailing rows and builds an HTML table from real ones', async () => {
    const { submitRfq } = await import('@/components/rfq/submitRfq')
    const result = await submitRfq(
      buildFormData({}, [
        { mpn: 'STM32F103C8T6', manufacturer: 'STMicroelectronics', quantity: '100', targetPrice: '150', leadTime: '10' },
        { mpn: '', manufacturer: '', quantity: '', targetPrice: '', leadTime: '' },
      ]),
    )

    expect(result).toEqual({ success: true })
    expect(sendTransactionalEmailMock).toHaveBeenCalledTimes(1)
    const [, args] = sendTransactionalEmailMock.mock.calls[0]
    expect(args.to).toBe('sales@picmychip.com')
    expect(args.subject).toContain('Analytical Engines Ltd')
    expect(args.html).toContain('STM32F103C8T6')
    expect(args.html).toContain('STMicroelectronics')
    // Only one <tr> for the real line — the blank trailing row was dropped.
    expect((args.html.match(/<tr>/g) || []).length).toBe(1)
  })

  it('escapes HTML in free-text fields to prevent injection into the notification email', async () => {
    const { submitRfq } = await import('@/components/rfq/submitRfq')
    await submitRfq(
      buildFormData(
        { firstName: '<script>alert(1)</script>', message: '<img src=x onerror=alert(1)>' },
        [{ mpn: 'X', manufacturer: 'Y' }],
      ),
    )

    const [, args] = sendTransactionalEmailMock.mock.calls[0]
    expect(args.html).not.toContain('<script>')
    expect(args.html).not.toContain('<img')
    expect(args.html).toContain('&lt;script&gt;')
  })

  it('base64-encodes an uploaded file and passes it as an attachment', async () => {
    const { submitRfq } = await import('@/components/rfq/submitRfq')
    const file = new File(['mpn,qty\nSTM32,10'], 'bom.csv', { type: 'text/csv' })

    const result = await submitRfq(buildFormData({}, [], file))

    expect(result).toEqual({ success: true })
    const [, args] = sendTransactionalEmailMock.mock.calls[0]
    expect(args.attachments).toHaveLength(1)
    expect(args.attachments[0].filename).toBe('bom.csv')
    expect(args.attachments[0].contentType).toBe('text/csv')
    expect(Buffer.from(args.attachments[0].content, 'base64').toString()).toBe('mpn,qty\nSTM32,10')
  })

  it('surfaces a friendly error and does not throw when the email send fails', async () => {
    sendTransactionalEmailMock.mockResolvedValue({ success: false, provider: null, fallbackUsed: true, messageId: null, error: 'boom' })
    const { submitRfq } = await import('@/components/rfq/submitRfq')

    const result = await submitRfq(buildFormData({}, [{ mpn: 'X', manufacturer: 'Y' }]))

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/went wrong/i)
  })
})
