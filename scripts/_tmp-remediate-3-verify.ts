import 'dotenv/config'
import { zohoFetch } from '../src/lib/zoho/auth'

async function main() {
  for (const id of ['3410447000000176008', '3410447000000171007']) {
    const data = await zohoFetch<{ invoice: any }>(`/invoices/${id}`)
    console.log(id, data.invoice.invoice_number, 'status:', data.invoice.status, 'balance:', data.invoice.balance, 'total:', data.invoice.total)
  }
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
