'use client'

import { CheckIcon } from 'lucide-react'
import React, { useState } from 'react'

import { submitReturnRequest } from '@/app/(app)/returns/submitReturnRequest'

const REASONS = [
  { label: 'Damaged / defective', value: 'damaged' },
  { label: 'Wrong item received', value: 'wrong-item' },
  { label: 'Not as described', value: 'not-as-described' },
  { label: 'No longer needed', value: 'no-longer-needed' },
  { label: 'Other', value: 'other' },
]

export const ReturnRequestForm: React.FC<{ defaultOrderId?: string }> = ({ defaultOrderId }) => {
  const [orderId, setOrderId] = useState(defaultOrderId ?? '')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('damaged')
  const [description, setDescription] = useState('')
  const [state, setState] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('submitting')
    setError(null)

    const result = await submitReturnRequest({ orderId, email, reason, description })

    if (result.success) {
      setState('done')
    } else {
      setState('idle')
      setError(result.error || 'Something went wrong.')
    }
  }

  if (state === 'done') {
    return (
      <div className="border-success/30 bg-success/5 text-success flex flex-col items-center gap-2 rounded-2xl border p-8 text-center">
        <CheckIcon className="size-8" />
        <p className="font-semibold">Return request submitted</p>
        <p className="text-foreground text-sm">
          We&apos;ll review your request and follow up by email at {email}.
        </p>
      </div>
    )
  }

  return (
    <form
      className="bg-card border-border flex flex-col gap-4 rounded-2xl border p-6 shadow-sm sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="orderId">
            Order ID
          </label>
          <input
            className="border-border bg-background rounded-lg border px-3 py-2 text-sm outline-none"
            id="orderId"
            onChange={(e) => setOrderId(e.target.value)}
            required
            value={orderId}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email used at checkout
          </label>
          <input
            className="border-border bg-background rounded-lg border px-3 py-2 text-sm outline-none"
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            value={email}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="reason">
          Reason
        </label>
        <select
          className="border-border bg-background rounded-lg border px-3 py-2 text-sm outline-none"
          id="reason"
          onChange={(e) => setReason(e.target.value)}
          value={reason}
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="description">
          Tell us more (optional)
        </label>
        <textarea
          className="border-border bg-background min-h-24 rounded-lg border px-3 py-2 text-sm outline-none"
          id="description"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
        />
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      <button className="btn btn-primary self-start" disabled={state === 'submitting'} type="submit">
        {state === 'submitting' ? 'Submitting...' : 'Submit return request'}
      </button>
    </form>
  )
}
