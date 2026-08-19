import { EmailProviderError, type EmailProvider, type EmailSendArgs, type EmailSendResult } from '../types'

const REQUEST_TIMEOUT_MS = 10_000

/**
 * The .env value for the ZeptoMail token may already include the
 * `Zoho-enczapikey ` scheme prefix (confirmed: this project's own `.env` has
 * it baked into `ZEPTOMAIL_API_KEY`) or may be the bare token (the
 * `ZEPTOMAIL_SEND_MAIL_TOKEN` shape) — normalized here so either works.
 */
export function buildZeptoMailAuthHeader(rawToken: string): string {
  const trimmed = rawToken.trim()
  if (/^zoho-enczapikey\s/i.test(trimmed)) return trimmed
  return `Zoho-enczapikey ${trimmed}`
}

const toZeptoRecipients = (to: string) =>
  to
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((address) => ({ email_address: { address } }))

/**
 * ZeptoMail transactional email API — fallback provider only.
 * Docs: https://www.zoho.com/zeptomail/help/api/email-sending.html
 */
export function createZeptoMailProvider(args: {
  token: string
  defaultFromAddress: string
  defaultFromName: string
  apiUrl?: string
}): EmailProvider {
  const { token, defaultFromAddress, defaultFromName } = args
  // ZeptoMail is data-center-specific (like Zoho's other APIs — see
  // ZOHO_API_DOMAIN) — an account provisioned on the .in data center gets
  // "Invalid API Token" from api.zeptomail.com even with a valid token, since
  // the token simply doesn't exist on the .com cluster. Defaults to .in
  // (confirmed working for this account); override via ZEPTOMAIL_API_URL if
  // the account ever moves data centers.
  const apiUrl = args.apiUrl || 'https://api.zeptomail.in/v1.1/email'
  const authHeader = buildZeptoMailAuthHeader(token)

  return {
    name: 'zeptomail',
    async send(message: EmailSendArgs): Promise<EmailSendResult> {
      const body = {
        from: {
          address: message.fromAddress || defaultFromAddress,
          name: message.fromName || defaultFromName,
        },
        to: toZeptoRecipients(message.to),
        subject: message.subject,
        htmlbody: message.html,
        ...(message.attachments?.length
          ? {
              attachments: message.attachments.map((a) => ({
                content: a.content,
                mime_type: a.contentType || 'application/octet-stream',
                name: a.filename,
              })),
            }
          : {}),
      }

      let response: Response
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            authorization: authHeader,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        throw new EmailProviderError(`ZeptoMail request failed with no response: ${message}`, 'ambiguous')
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        const kind = response.status >= 500 ? 'temporary' : 'permanent'
        throw new EmailProviderError(`ZeptoMail email send failed (${response.status}): ${errorText}`, kind, response.status)
      }

      const data = await response.json().catch(() => undefined)
      // Documented shape: { data: [{ message_id, ... }], request_id, message, ... }
      const messageId = data?.data?.[0]?.message_id ?? data?.request_id
      return { messageId }
    },
  }
}
