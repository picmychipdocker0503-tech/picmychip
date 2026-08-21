import { getZohoApiDomain, zohoFetch, zohoFetchBinary } from './auth'

export type ZohoCreditNote = {
  creditnote_id: string
  creditnote_number: string
  status?: string
  total?: number
  balance?: number
  creditnote_url?: string
  invoice_id?: string
  invoices?: { invoice_id?: string }[]
}

function matchesInvoice(creditNote: ZohoCreditNote, invoiceId: string): boolean {
  if (creditNote.invoice_id === invoiceId) return true
  return creditNote.invoices?.some((invoice) => invoice.invoice_id === invoiceId) ?? false
}

export async function findCreditNoteForInvoice(invoiceId: string): Promise<ZohoCreditNote | undefined> {
  const params = new URLSearchParams({ invoice_id: invoiceId })
  const data = await zohoFetch<{ creditnotes: ZohoCreditNote[] }>(`/creditnotes?${params.toString()}`)
  const listed = data.creditnotes?.[0]

  if (listed) {
    return getZohoCreditNote(listed.creditnote_id)
  }

  const allData = await zohoFetch<{ creditnotes: ZohoCreditNote[] }>('/creditnotes')
  for (const creditNote of allData.creditnotes ?? []) {
    const full = await getZohoCreditNote(creditNote.creditnote_id)
    if (matchesInvoice(full, invoiceId)) return full
  }

  return undefined
}

export async function getZohoCreditNote(creditNoteId: string): Promise<ZohoCreditNote> {
  const data = await zohoFetch<{ creditnote: ZohoCreditNote }>(`/creditnotes/${creditNoteId}`)
  return data.creditnote
}

export async function getCreditNotePdfBytes(creditNoteId: string): Promise<Buffer> {
  const params = new URLSearchParams({ creditnote_ids: creditNoteId })
  return zohoFetchBinary(`/creditnotes/print?${params.toString()}`)
}

export function getCreditNoteUrl(creditNote: ZohoCreditNote): string {
  if (creditNote.creditnote_url) return creditNote.creditnote_url
  const appDomain = getZohoApiDomain().replace('www.zohoapis', 'books.zoho')
  return `${appDomain}/app/${process.env.ZOHO_ORGANIZATION_ID || ''}#/creditnotes/${creditNote.creditnote_id}`
}
