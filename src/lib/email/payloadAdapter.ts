import type { PayloadEmailAdapter as EmailAdapter, SendEmailOptions } from 'payload'

import { sendTransactionalEmail } from './emailService'

// SendEmailOptions#to reuses nodemailer's flexible address type — a plain
// string (possibly comma-separated, possibly "Name <email>"), a
// {name, address} object, or an array of either. Flattened to the single
// comma-separated string emailService/the providers expect.
function flattenAddress(value: SendEmailOptions['to']): string {
  if (!value) return ''
  const entries = Array.isArray(value) ? value : [value]
  return entries
    .map((entry) => {
      if (typeof entry === 'string') return entry
      if (entry && typeof entry === 'object' && 'address' in entry) return entry.address
      return ''
    })
    .filter(Boolean)
    .join(',')
}

// Best-effort id for the emails this adapter handles that app code can't
// intercept per-call (Payload's own internal verify-email/forgot-password
// sends) — not a stable entity id like an order id, but bucketed to the
// hour so a retried send within the same short window is still deduped.
function bestEffortEventId(to: string, subject: string): string {
  const hourBucket = new Date().toISOString().slice(0, 13)
  const safeSubject = subject.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40)
  return `AUTH_${safeSubject}_${to}_${hourBucket}`
}

/**
 * The adapter configured as Payload's `email` field — this is what makes
 * Payload's own internal auth emails (account verification, forgot-password)
 * benefit from the Brevo→ZeptoMail fallback too, since those are sent by
 * Payload core calling `payload.sendEmail()` directly and app code has no
 * per-call hook into them; only the configured adapter sees them.
 */
export const transactionalEmailPayloadAdapter = (): EmailAdapter => {
  return ({ payload }) => ({
    name: 'transactional-email-service',
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@picmychip.com',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Picmychip',
    sendEmail: async (message: SendEmailOptions) => {
      const to = flattenAddress(message.to)
      const subject = message.subject || ''
      const html = typeof message.html === 'string' ? message.html : ''

      const result = await sendTransactionalEmail(payload, {
        eventId: bestEffortEventId(to, subject),
        emailType: 'PAYLOAD_AUTH',
        to,
        subject,
        html,
      })

      if (!result.success) throw new Error(result.error)
      return result
    },
  })
}
