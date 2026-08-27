'use client'

import React, { useEffect } from 'react'

import { BrokenCircuit } from '@/components/illustrations'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container my-12 flex justify-center">
      <div className="border-border bg-card flex max-w-xl flex-col items-center rounded-2xl border p-8 text-center shadow-sm md:p-12">
        <div className="bg-primary/10 text-primary mb-5 flex size-20 items-center justify-center rounded-2xl">
          <BrokenCircuit className="size-12" />
        </div>
        <h2 className="text-foreground text-xl font-bold">Oh no!</h2>
        <p className="text-muted-foreground my-2">
          There was an issue with our storefront. This could be a temporary issue, please try your
          action again.
        </p>
        <button
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 flex w-full items-center justify-center rounded-full p-4 tracking-wide transition-colors"
          onClick={() => reset()}
          type="button"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
