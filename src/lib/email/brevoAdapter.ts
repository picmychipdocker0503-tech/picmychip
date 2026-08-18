import type { PayloadEmailAdapter as EmailAdapter, SendEmailOptions } from 'payload'

type BrevoRecipient = { email: string; name?: string }

// SendEmailOptions#to/cc/bcc reuse nodemailer's flexible address type — a
// plain string (possibly comma-separated, possibly "Name <email>"), a
// {name, address} object, or an array of either. Brevo's API wants a plain
// [{email, name?}] array regardless of which shape came in.
const toBrevoRecipients = (
  value: SendEmailOptions['to'] | SendEmailOptions['cc'] | SendEmailOptions['bcc'],
): BrevoRecipient[] | undefined => {
  if (!value) return undefined

  const entries = Array.isArray(value) ? value : [value]

  const recipients = entries.flatMap((entry): BrevoRecipient[] => {
    if (typeof entry === 'string') {
      return entry
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const match = part.match(/^(.*)<(.+)>$/)
          return match
            ? { email: match[2].trim(), name: match[1].trim().replace(/^"|"$/g, '') || undefined }
            : { email: part }
        })
    }
    if ('address' in entry) return [{ email: entry.address, name: entry.name || undefined }]
    return []
  })

  return recipients.length > 0 ? recipients : undefined
}

/**
 * Sends transactional email via Brevo's (formerly Sendinblue) REST API
 * directly, rather than SMTP — the provided credential is a v3 API key
 * (`xkeysib-...`), which Brevo's SMTP relay doesn't accept as a password on
 * its own (it expects a separate SMTP login/key pair from the account).
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */
export const brevoAdapter = (args: {
  apiKey: string
  defaultFromAddress: string
  defaultFromName: string
}): EmailAdapter => {
  const { apiKey, defaultFromAddress, defaultFromName } = args

  return () => ({
    name: 'brevo-rest',
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message: SendEmailOptions) => {
      const from =
        typeof message.from === 'string'
          ? (() => {
              const match = message.from!.match(/^(.*)<(.+)>$/)
              return match
                ? { email: match[2].trim(), name: match[1].trim().replace(/^"|"$/g, '') || undefined }
                : { email: message.from as string }
            })()
          : message.from
            ? { email: message.from.address, name: message.from.name || undefined }
            : { email: defaultFromAddress, name: defaultFromName }

      const body = {
        sender: from,
        to: toBrevoRecipients(message.to),
        cc: toBrevoRecipients(message.cc),
        bcc: toBrevoRecipients(message.bcc),
        subject: message.subject,
        htmlContent: typeof message.html === 'string' ? message.html : undefined,
        textContent: typeof message.text === 'string' ? message.text : undefined,
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`Brevo email send failed (${response.status}): ${errorText}`)
      }

      return response.json().catch(() => undefined)
    },
  })
}
