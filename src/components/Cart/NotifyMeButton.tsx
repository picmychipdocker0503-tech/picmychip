'use client'

import { BellIcon, CheckIcon, SendIcon } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { subscribeToStockAlert } from '@/components/product/subscribeToStockAlert'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/cn'

type Props = {
  productId: number
  className?: string
}

type Stage = 'idle' | 'form' | 'submitting' | 'done'

/**
 * Replaces the Add to Cart button when a product is out of stock. Rather
 * than a plain disabled button, it "flips" (a quick scaleX(0) collapse and
 * re-expand, swapping content at the midpoint — simpler and more robust
 * across browsers than a true backface-visibility 3D flip) from a compact
 * "Notify me" pill into an inline email capture, reusing the same
 * subscribeToStockAlert action as the PDP's BackInStockForm. Logged-in
 * shoppers skip the typing step entirely — their account email is used
 * straight away — so the form only ever shows to guests.
 */
export const NotifyMeButton: React.FC<Props> = ({ productId, className }) => {
  const { user } = useAuth()
  const [stage, setStage] = useState<Stage>('idle')
  const [flipping, setFlipping] = useState(false)
  const [email, setEmail] = useState('')

  const swapTo = (next: Stage) => {
    setFlipping(true)
    window.setTimeout(() => {
      setStage(next)
      setFlipping(false)
    }, 150)
  }

  const submit = async (targetEmail: string) => {
    swapTo('submitting')
    const result = await subscribeToStockAlert({ productId, email: targetEmail })

    if (result.success) {
      swapTo('done')
    } else {
      swapTo(user?.email ? 'idle' : 'form')
      toast.error(result.error || 'Something went wrong.')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    submit(email)
  }

  return (
    <div
      className={cn(
        'transition-transform duration-150 ease-in',
        flipping ? 'scale-x-0' : 'scale-x-100',
        className,
      )}
    >
      {stage === 'idle' && (
        <button
          aria-label="Notify me when back in stock"
          className="border-warning bg-warning text-warning-content hover:brightness-95 flex size-9 items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition-[filter] sm:w-auto sm:px-4"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()

            if (user?.email) {
              submit(user.email)
            } else {
              swapTo('form')
            }
          }}
          type="button"
        >
          <BellIcon className="size-3.5 shrink-0" />
          <span className="hidden sm:inline">Notify me</span>
        </button>
      )}

      {stage === 'form' && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <form
          className="border-border bg-background flex h-9 items-center overflow-hidden rounded-full border pl-3"
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <input
            aria-label="Email address for back-in-stock notification"
            autoFocus
            className="w-20 min-w-0 bg-transparent text-xs outline-none sm:w-32"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            type="email"
            value={email}
          />
          <button
            aria-label="Submit"
            className="bg-foreground text-background flex h-full w-9 shrink-0 items-center justify-center"
            type="submit"
          >
            <SendIcon className="size-3.5" />
          </button>
        </form>
      )}

      {stage === 'submitting' && (
        <div className="border-border bg-background text-muted-foreground flex h-9 items-center justify-center rounded-full border px-4 text-xs">
          Saving...
        </div>
      )}

      {stage === 'done' && (
        <div className="border-success/30 bg-success/10 text-success flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold">
          <CheckIcon className="size-3.5 shrink-0" />
          <span className="hidden sm:inline">We&apos;ll notify you</span>
        </div>
      )}
    </div>
  )
}
