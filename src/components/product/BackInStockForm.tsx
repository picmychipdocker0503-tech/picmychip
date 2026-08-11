'use client'

import { BellIcon, CheckIcon } from 'lucide-react'
import React, { useState } from 'react'

import { subscribeToStockAlert } from './subscribeToStockAlert'

type Props = {
  productId: number
}

export const BackInStockForm: React.FC<Props> = ({ productId }) => {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('submitting')
    setError(null)

    const result = await subscribeToStockAlert({ productId, email })

    if (result.success) {
      setState('done')
    } else {
      setState('idle')
      setError(result.error || 'Something went wrong.')
    }
  }

  if (state === 'done') {
    return (
      <div className="border-success/30 bg-success/5 text-success flex items-center gap-2 rounded-lg border p-3 text-sm font-medium">
        <CheckIcon className="size-4" />
        We&apos;ll email you when this is back in stock.
      </div>
    )
  }

  return (
    <form className="border-border flex flex-col gap-2 rounded-lg border p-3" onSubmit={handleSubmit}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <BellIcon className="size-4" />
        Notify me when back in stock
      </p>
      <div className="flex gap-2">
        <input
          aria-label="Email address for back-in-stock notification"
          className="border-border bg-background flex-1 rounded-md border px-3 py-2 text-sm outline-none"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <button className="btn btn-primary btn-sm" disabled={state === 'submitting'} type="submit">
          {state === 'submitting' ? 'Saving...' : 'Notify me'}
        </button>
      </div>
      {error && <p className="text-error text-xs">{error}</p>}
    </form>
  )
}
