'use client'

import type { Cart } from '@/payload-types'

import { StatusPill } from '@/components/admin/StatusPill'
import { formatDateTime } from '@/utilities/formatDateTime'
import { toast } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type Props = {
  carts: Cart[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export const AbandonedCheckoutsTable: React.FC<Props> = ({ carts }) => {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  const handleSendNow = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/admin/send-abandoned-cart-emails', { method: 'POST' })
      if (!response.ok) throw new Error('Request failed')
      const result: { sent: number; checked: number } = await response.json()
      toast.success(`Sent ${result.sent} recovery email${result.sent === 1 ? '' : 's'} (${result.checked} carts checked).`)
      router.refresh()
    } catch {
      toast.error('Failed to send recovery emails — please retry.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full"
          disabled={sending}
          onClick={handleSendNow}
          type="button"
        >
          {sending ? 'Sending…' : 'Send recovery emails now'}
        </button>
      </div>

      <div className="border-base-content/10 pmc-rounded-box overflow-x-auto border">
        <table className="pmc-table pmc-table-zebra">
          <thead>
            <tr className="text-base-content/70">
              <th>Customer</th>
              <th>Items</th>
              <th>Subtotal</th>
              <th>Last activity</th>
              <th>Recovery</th>
            </tr>
          </thead>
          <tbody>
            {carts.length === 0 && (
              <tr>
                <td className="text-base-content/50" colSpan={5}>
                  No abandoned checkouts right now.
                </td>
              </tr>
            )}
            {carts.map((cart) => {
              const customer = typeof cart.customer === 'object' ? cart.customer : undefined

              return (
                <tr key={cart.id}>
                  <td>
                    <a className="pmc-link pmc-link-hover" href={`/admin/collections/users/${customer?.id ?? ''}`}>
                      {customer?.name || customer?.email || `Customer #${cart.customer}`}
                    </a>
                  </td>
                  <td>{cart.items?.length ?? 0}</td>
                  <td>{typeof cart.subtotal === 'number' ? formatCurrency(cart.subtotal) : '—'}</td>
                  <td className="text-base-content/60">
                    {formatDateTime({ date: cart.updatedAt, format: 'MMM d, h:mm a' })}
                  </td>
                  <td>
                    {cart.abandonedRecoveryEmailSentAt ? (
                      <StatusPill label="Emailed" tone="success" />
                    ) : (
                      <StatusPill label="Not contacted" tone="warning" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
