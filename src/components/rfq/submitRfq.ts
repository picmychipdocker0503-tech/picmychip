'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { sendTransactionalEmail } from '@/lib/email/emailService'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // matches the existing "Start a Request" BOM upload cap

type LineItem = {
  mpn: string
  manufacturer: string
  quantity: string
  targetPrice: string
  leadTime: string
}

type SubmitRfqResult = {
  success: boolean
  error?: string
  ticketId?: string
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function parseLineItems(raw: string): LineItem[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  return parsed
    .map((item) => ({
      mpn: String((item as Record<string, unknown>)?.mpn ?? '').trim(),
      manufacturer: String((item as Record<string, unknown>)?.manufacturer ?? '').trim(),
      quantity: String((item as Record<string, unknown>)?.quantity ?? '').trim(),
      targetPrice: String((item as Record<string, unknown>)?.targetPrice ?? '').trim(),
      leadTime: String((item as Record<string, unknown>)?.leadTime ?? '').trim(),
    }))
    // A line only counts once the customer has actually entered something identifying — an
    // untouched trailing blank row (always present so there's somewhere to type) shouldn't
    // show up as an empty row in the notification email.
    .filter((item) => item.mpn || item.manufacturer)
}

export async function submitRfq(formData: FormData): Promise<SubmitRfqResult> {
  const payload = await getPayload({ config: configPromise })

  const email = String(formData.get('email') || '').trim()
  const firstName = String(formData.get('firstName') || '').trim()
  const lastName = String(formData.get('lastName') || '').trim()
  const company = String(formData.get('company') || '').trim()
  const gst = String(formData.get('gst') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const message = String(formData.get('message') || '').trim()
  const lineItems = parseLineItems(String(formData.get('lineItems') || '[]'))
  const file = formData.get('file')
  const uploadedFile = file instanceof File && file.size > 0 ? file : null

  if (!email || !firstName || !lastName) {
    return { success: false, error: 'Please fill in your name and email.' }
  }

  if (lineItems.length === 0 && !uploadedFile) {
    return { success: false, error: 'Add at least one part number or upload a BOM file.' }
  }

  if (uploadedFile && uploadedFile.size > MAX_FILE_SIZE) {
    return { success: false, error: 'That file is larger than 10MB — please upload a smaller BOM.' }
  }

  let attachments: { filename: string; content: string; contentType?: string }[] | undefined
  if (uploadedFile) {
    const buffer = Buffer.from(await uploadedFile.arrayBuffer())
    attachments = [
      {
        filename: uploadedFile.name,
        content: buffer.toString('base64'),
        contentType: uploadedFile.type || undefined,
      },
    ]
  }

  const submitterLabel = company || `${firstName} ${lastName}`
  const ticketId = `RFQ-${crypto.randomUUID().split('-')[0].toUpperCase()}`
  const submittedAt = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())
  const subject = `New RFQ / BOM Submission - ${submitterLabel} - ${ticketId}`

  const lineItemsTable = lineItems.length
    ? `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
        <thead>
          <tr style="background:#f3f4f6;text-align:left">
            <th>MPN</th><th>Manufacturer</th><th>Quantity</th><th>Target Price</th><th>Target Lead Time</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems
            .map(
              (item) =>
                `<tr><td>${escapeHtml(item.mpn)}</td><td>${escapeHtml(item.manufacturer)}</td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(item.targetPrice)}</td><td>${escapeHtml(item.leadTime)}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table>`
    : '<p>No manual line items were entered — see the attached BOM file for the requested parts.</p>'

  const html = `
    <h2>New RFQ / BOM Submission</h2>
    <p><b>Ticket ID:</b> ${escapeHtml(ticketId)}</p>
    <p><b>Submitted:</b> ${escapeHtml(submittedAt)} IST</p>
    <p><b>Submitted by:</b> ${escapeHtml(firstName)} ${escapeHtml(lastName)} (${escapeHtml(email)})</p>
    ${company ? `<p><b>Company:</b> ${escapeHtml(company)}</p>` : ''}
    ${gst ? `<p><b>GSTIN:</b> ${escapeHtml(gst)}</p>` : ''}
    ${phone ? `<p><b>Phone:</b> ${escapeHtml(phone)}</p>` : ''}
    ${lineItemsTable}
    ${uploadedFile ? `<p><b>Attached BOM file:</b> ${escapeHtml(uploadedFile.name)}</p>` : ''}
    ${message ? `<p><b>Message:</b><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>` : ''}
  `

  const result = await sendTransactionalEmail(payload, {
    to: 'sales@picmychip.com',
    subject,
    html,
    emailType: 'RFQ_SUBMISSION',
    // Not deduped across requests — a customer resubmitting a revised BOM or
    // grid should always generate a fresh notification.
    eventId: `RFQ_SUBMISSION_${Date.now()}_${email}`,
    attachments,
  })

  if (!result.success) {
    payload.logger.error({ msg: 'Failed to send RFQ submission email', error: result.error })
    return { success: false, error: 'Something went wrong sending your request. Please try again or email us directly.' }
  }

  return { success: true, ticketId }
}
