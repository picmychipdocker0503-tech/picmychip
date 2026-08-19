export type EmailSendArgs = {
  to: string
  subject: string
  html: string
  fromAddress?: string
  fromName?: string
}

export type EmailSendResult = {
  messageId?: string
}

/**
 * `permanent` — the provider responded and rejected the request (4xx):
 * retrying won't help.
 * `temporary` — the provider responded but with a server-side error (5xx):
 * worth a bounded retry.
 * `ambiguous` — no response was ever received (timeout/network/DNS/abort).
 * The provider may or may not have accepted the request — this is NEVER
 * treated as a confirmed failure worth auto-falling-back on, per the
 * anti-duplicate requirement (see emailService.ts).
 */
export type EmailProviderErrorKind = 'permanent' | 'temporary' | 'ambiguous'

export class EmailProviderError extends Error {
  kind: EmailProviderErrorKind
  statusCode?: number

  constructor(message: string, kind: EmailProviderErrorKind, statusCode?: number) {
    super(message)
    this.name = 'EmailProviderError'
    this.kind = kind
    this.statusCode = statusCode
  }
}

export interface EmailProvider {
  name: 'brevo' | 'zeptomail'
  send(args: EmailSendArgs): Promise<EmailSendResult>
}

export type EmailProviderName = EmailProvider['name']

export type TransactionalEmailStatus = 'sent' | 'failed' | 'unknown'

export type SendTransactionalEmailArgs = {
  /** Deterministic per logical email event where possible (e.g. `ORDER_CONFIRMATION_12345`) — used for idempotency, not just logging. */
  eventId: string
  emailType: string
  to: string
  subject: string
  html: string
}

export type SendTransactionalEmailResult =
  | { success: true; provider: 'BREVO' | 'ZEPTOMAIL'; fallbackUsed: boolean; messageId?: string }
  | { success: false; provider: null; fallbackUsed: boolean; messageId: null; error: string }
