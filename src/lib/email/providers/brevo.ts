import { EmailProviderError, type EmailProvider, type EmailSendArgs, type EmailSendResult } from '../types'

const REQUEST_TIMEOUT_MS = 10_000

type BrevoRecipient = { email: string; name?: string }

// EmailSendArgs#to is a plain string — possibly comma-separated for
// multiple recipients, matching the convention every call site already uses.
const toBrevoRecipients = (to: string): BrevoRecipient[] =>
  to
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((email) => ({ email }))

/**
 * Sends transactional email via Brevo's (formerly Sendinblue) REST API
 * directly, rather than SMTP — the provided credential is a v3 API key
 * (`xkeysib-...`), which Brevo's SMTP relay doesn't accept as a password on
 * its own (it expects a separate SMTP login/key pair from the account).
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */
export function createBrevoProvider(args: {
  apiKey: string
  defaultFromAddress: string
  defaultFromName: string
}): EmailProvider {
  const { apiKey, defaultFromAddress, defaultFromName } = args

  return {
    name: 'brevo',
    async send(message: EmailSendArgs): Promise<EmailSendResult> {
      const body = {
        sender: {
          email: message.fromAddress || defaultFromAddress,
          name: message.fromName || defaultFromName,
        },
        to: toBrevoRecipients(message.to),
        subject: message.subject,
        htmlContent: message.html,
        ...(message.attachments?.length
          ? { attachment: message.attachments.map((a) => ({ content: a.content, name: a.filename })) }
          : {}),
      }

      let response: Response
      try {
        response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
      } catch (err) {
        // fetch throws (TypeError/AbortError) on timeout, DNS failure, connection
        // refused/reset — no response was ever received, so Brevo's actual
        // handling of the request is unknown, not "failed".
        const message = err instanceof Error ? err.message : String(err)
        throw new EmailProviderError(`Brevo request failed with no response: ${message}`, 'ambiguous')
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        const kind = response.status >= 500 ? 'temporary' : 'permanent'
        throw new EmailProviderError(`Brevo email send failed (${response.status}): ${errorText}`, kind, response.status)
      }

      const data = await response.json().catch(() => undefined)
      return { messageId: data?.messageId }
    },
  }
}
