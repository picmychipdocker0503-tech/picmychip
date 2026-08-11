'use client'

import { TruckIcon } from 'lucide-react'
import React, { useState } from 'react'

const PINCODE_PATTERN = /^\d{6}$/

export const DeliveryEstimate: React.FC = () => {
  const [pincode, setPincode] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault()

    if (!PINCODE_PATTERN.test(pincode)) {
      setResult({ ok: false, message: 'Please enter a valid 6-digit pincode.' })
      return
    }

    // No live courier API is wired up yet — this is a general estimate,
    // not a real-time serviceability check against a specific pincode.
    setResult({
      ok: true,
      message: `Estimated delivery in 3–5 business days to ${pincode}.`,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <TruckIcon className="size-4" />
        Check estimated delivery
      </div>
      <form className="flex gap-2" onSubmit={checkPincode}>
        <input
          className="border-border bg-background w-32 rounded-lg border px-3 py-2 text-sm"
          inputMode="numeric"
          maxLength={6}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          placeholder="Pincode"
          value={pincode}
        />
        <button className="btn btn-outline btn-sm" type="submit">
          Check
        </button>
      </form>
      {result && (
        <p className={result.ok ? 'text-success text-sm' : 'text-destructive text-sm'}>{result.message}</p>
      )}
    </div>
  )
}
