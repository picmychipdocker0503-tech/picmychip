'use server'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { sendTransactionalEmail } from '@/lib/email/emailService'

import { DURATION_OPTIONS, ENGAGEMENT_OPTIONS, SKILL_OPTIONS } from './options'

type SubmitTechnicianRequestResult = {
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

const labelFor = (options: readonly { label: string; value: string }[], value: string) =>
  options.find((option) => option.value === value)?.label

export async function submitTechnicianRequest(formData: FormData): Promise<SubmitTechnicianRequestResult> {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })

  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const company = String(formData.get('company') || '').trim()
  const location = String(formData.get('location') || '').trim()
  const startDate = String(formData.get('startDate') || '').trim()
  const message = String(formData.get('message') || '').trim()
  const otherSkill = String(formData.get('otherSkill') || '').trim()
  const technicians = Math.min(Math.max(Number.parseInt(String(formData.get('technicians') || '1'), 10) || 1, 1), 500)

  // Only accept known option values — the form is public, so never trust
  // free-form values for the select fields.
  const engagementRaw = String(formData.get('engagement') || '')
  const durationRaw = String(formData.get('duration') || '')
  const engagement = labelFor(ENGAGEMENT_OPTIONS, engagementRaw) ? engagementRaw : undefined
  const duration = labelFor(DURATION_OPTIONS, durationRaw) ? durationRaw : undefined
  const skills = formData
    .getAll('skills')
    .map(String)
    .filter((skill) => (SKILL_OPTIONS as readonly string[]).includes(skill))
  if (otherSkill) skills.push(otherSkill.slice(0, 120))

  if (!name || !email || !phone) {
    return { success: false, error: 'Please fill in your name, email and phone number.' }
  }

  if (skills.length === 0 && !message) {
    return { success: false, error: 'Select at least one skill or describe the work in the message box.' }
  }

  const ticketId = `TECH-${crypto.randomUUID().split('-')[0].toUpperCase()}`
  const submittedAt = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())
  const submitterLabel = company || name
  const subject = `New Technician Request - ${submitterLabel} - ${ticketId}`

  const rows: [string, string | undefined][] = [
    ['Ticket ID', ticketId],
    ['Submitted', `${submittedAt} IST`],
    ['Name', name],
    ['Email', email],
    ['Phone', phone],
    ['Company', company || undefined],
    ['Skills', skills.join(', ') || undefined],
    ['Technicians needed', String(technicians)],
    ['Engagement', engagement ? labelFor(ENGAGEMENT_OPTIONS, engagement) : undefined],
    ['Duration', duration ? labelFor(DURATION_OPTIONS, duration) : undefined],
    ['Location', location || undefined],
    ['Start date', startDate || undefined],
  ]

  const html = `
    <h2>New Technician Request</h2>
    ${rows
      .filter(([, value]) => value)
      .map(([label, value]) => `<p><b>${escapeHtml(label)}:</b> ${escapeHtml(value as string)}</p>`)
      .join('')}
    ${message ? `<p><b>Requirement details:</b><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>` : ''}
  `

  // Persisted so the request is manageable from the admin panel even if the
  // notification email below fails — best effort, since the email to sales is
  // the critical path (same approach as submitRfq).
  try {
    await payload.create({
      collection: 'technician-requests',
      data: {
        ticketId,
        customer: user?.id,
        name,
        email,
        phone,
        company: company || undefined,
        skills: skills.join(', ') || undefined,
        technicians,
        engagement: engagement as 'onsite' | 'facility' | 'either' | undefined,
        duration: duration as 'day' | 'week' | 'month' | 'long-term' | 'not-sure' | undefined,
        location: location || undefined,
        startDate: startDate && !Number.isNaN(Date.parse(startDate)) ? new Date(startDate).toISOString() : undefined,
        message: message || undefined,
      },
      overrideAccess: true,
    })
  } catch (error) {
    payload.logger.error({ msg: 'Failed to save technician request record', error, ticketId })
  }

  const result = await sendTransactionalEmail(payload, {
    to: 'sales@picmychip.com',
    subject,
    html,
    emailType: 'TECHNICIAN_REQUEST',
    eventId: `TECHNICIAN_REQUEST_${Date.now()}_${email}`,
  })

  if (!result.success) {
    payload.logger.error({ msg: 'Failed to send technician request email', error: result.error })
    return { success: false, error: 'Something went wrong sending your request. Please try again or email us directly.' }
  }

  return { success: true, ticketId }
}
