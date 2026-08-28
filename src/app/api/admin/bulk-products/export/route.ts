import { checkRole } from '@/access/utilities'
import { generateProductsExport } from '@/lib/bulkProducts/exportProducts'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!checkRole(['admin'], user)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const buffer = await generateProductsExport(payload)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="products-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
