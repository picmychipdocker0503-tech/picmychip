import 'dotenv/config'
import crypto from 'crypto'
import ExcelJS from 'exceljs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

/**
 * One-off migration: imports Zoho Books "Contacts" export rows where
 * Contact Type = customer AND GST Treatment = consumer into Payload as
 * Users (login-capable, but with an unusable random password — they must
 * use "Forgot Password" to actually log in, since they never signed up on
 * this site) + a linked Address per row (email, phone, billing address).
 *
 * Safe to re-run: skips any email that already has a Payload User account,
 * and skips known internal/business emails.
 *
 * Usage:
 *   npx tsx scripts/import-zoho-consumer-contacts.ts --dry-run   (preview only, no writes)
 *   npx tsx scripts/import-zoho-consumer-contacts.ts             (actually imports)
 *   npx tsx scripts/import-zoho-consumer-contacts.ts "C:/path/to/Contacts.xlsx"  (custom source file)
 */

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SOURCE_FILE = args.find((arg) => !arg.startsWith('--')) || 'C:/Users/Picmychip/Downloads/Contacts (2).xlsx'

// Known internal/operational emails that should never be imported as a "customer".
const EXCLUDED_EMAILS = new Set(['sales@picmychip.com'])

const randomPassword = (): string => crypto.randomBytes(24).toString('hex')

type SourceRow = {
  rowNumber: number
  email: string
  name: string
  phone: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  zohoContactId: string
}

async function main() {
  const payload = await getPayload({ config })

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(SOURCE_FILE)
  const sheet = workbook.worksheets[0]

  const headerRow = sheet.getRow(1)
  const colIndex: Record<string, number> = {}
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (typeof cell.value === 'string') colIndex[cell.value] = colNumber
  })

  const getCell = (row: ExcelJS.Row, key: string): string => {
    const idx = colIndex[key]
    if (!idx) return ''
    const value = row.getCell(idx).value
    if (value === null || value === undefined) return ''
    return String(value).trim()
  }

  const rows: SourceRow[] = []
  const skippedNoEmail: { rowNumber: number; name: string; zohoContactId: string }[] = []
  const skippedExcluded: { rowNumber: number; email: string }[] = []

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return

    const contactType = getCell(row, 'Contact Type')
    const gstTreatment = getCell(row, 'GST Treatment')
    if (contactType !== 'customer' || gstTreatment !== 'consumer') return

    const email = getCell(row, 'EmailID').toLowerCase()
    const zohoContactId = getCell(row, 'Contact ID')
    const displayName = getCell(row, 'Contact Name') || getCell(row, 'Display Name')

    if (!email) {
      skippedNoEmail.push({ rowNumber, name: displayName, zohoContactId })
      return
    }
    if (EXCLUDED_EMAILS.has(email)) {
      skippedExcluded.push({ rowNumber, email })
      return
    }

    rows.push({
      rowNumber,
      email,
      name: displayName || [getCell(row, 'First Name'), getCell(row, 'Last Name')].filter(Boolean).join(' '),
      phone: getCell(row, 'Phone') || getCell(row, 'MobilePhone') || getCell(row, 'Billing Phone'),
      firstName: getCell(row, 'Billing Attention') || getCell(row, 'First Name'),
      lastName: getCell(row, 'Last Name'),
      addressLine1: getCell(row, 'Billing Address'),
      addressLine2: getCell(row, 'Billing Street2'),
      city: getCell(row, 'Billing City'),
      state: getCell(row, 'Billing State'),
      postalCode: getCell(row, 'Billing Code'),
      zohoContactId,
    })
  })

  // Group by email — duplicate rows for the same email become one User with
  // multiple linked Addresses, instead of erroring on a duplicate account.
  const byEmail = new Map<string, SourceRow[]>()
  for (const row of rows) {
    byEmail.set(row.email, [...(byEmail.get(row.email) ?? []), row])
  }

  console.log(`Matched ${rows.length} rows (${byEmail.size} unique emails). Dry run: ${DRY_RUN}`)
  console.log(`Skipped — no email: ${skippedNoEmail.length}`)
  console.log(`Skipped — excluded/internal email: ${skippedExcluded.length}`)

  let createdUsers = 0
  let createdAddresses = 0
  let skippedExistingUsers = 0
  const failed: { email: string; error: string }[] = []

  for (const [email, group] of byEmail) {
    try {
      const existing = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        overrideAccess: true,
      })

      if (existing.docs[0]) {
        skippedExistingUsers += 1
        continue
      }

      const primary = group[0]
      let userId: number | undefined

      if (!DRY_RUN) {
        const user = await payload.create({
          collection: 'users',
          data: {
            email,
            name: primary.name || undefined,
            roles: ['customer'],
            zohoCustomerId: primary.zohoContactId || undefined,
            password: randomPassword(),
            // Marks the account already-verified in the DB (doesn't by itself
            // stop the email — that's the top-level option below).
            _verified: true,
          },
          overrideAccess: true,
          // The actual switch that suppresses Payload's auto-sent "Verify your
          // account" email. Setting `_verified: true` in `data` alone does
          // NOT stop it — confirmed live via a real Brevo send during
          // testing — this top-level option is what create.js actually
          // checks before calling sendVerificationEmail.
          disableVerificationEmail: true,
        })
        userId = user.id
      }
      createdUsers += 1

      for (const [index, row] of group.entries()) {
        if (!DRY_RUN && userId) {
          await payload.create({
            collection: 'addresses',
            data: {
              customer: userId,
              firstName: row.firstName || undefined,
              lastName: row.lastName || undefined,
              addressLine1: row.addressLine1 || undefined,
              addressLine2: row.addressLine2 || undefined,
              city: row.city || undefined,
              state: row.state || undefined,
              postalCode: row.postalCode || undefined,
              country: 'IN',
              phone: row.phone || undefined,
              email,
              label: index === 0 ? 'Home' : 'Other',
              isDefaultBilling: index === 0,
              isDefaultShipping: index === 0,
            },
            overrideAccess: true,
          })
        }
        createdAddresses += 1
      }
    } catch (err) {
      failed.push({ email, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  console.log('\n--- Result ---')
  console.log('Users created:', createdUsers)
  console.log('Addresses created:', createdAddresses)
  console.log('Skipped (email already has a Payload account):', skippedExistingUsers)
  console.log('Failed:', failed.length)
  if (failed.length) console.log(JSON.stringify(failed, null, 2))

  if (skippedNoEmail.length) {
    console.log('\n--- Skipped rows: no email in sheet ---')
    for (const r of skippedNoEmail) console.log(r)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
