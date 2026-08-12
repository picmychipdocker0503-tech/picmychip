'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')

    try {
      const response = await fetch('/api/newsletter-subscribers', {
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (!response.ok) throw new Error('Subscription failed')

      setStatus('success')
      setEmail('')
      toast.success("Subscribed! You're on the list.")
    } catch {
      setStatus('error')
      toast.error('Something went wrong — please try again.')
    }
  }

  return (
    <form className="flex w-full max-w-md gap-2" onSubmit={onSubmit}>
      <input
        aria-label="Email address"
        className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-primary flex-1 rounded-lg border px-4 py-3 text-sm outline-none"
        data-1p-ignore=""
        data-bwignore="true"
        data-form-type="other"
        data-lpignore="true"
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        type="email"
        value={email}
      />
      <button
        className="btn btn-primary shrink-0"
        disabled={status === 'submitting'}
        type="submit"
      >
        {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
      </button>
    </form>
  )
}
