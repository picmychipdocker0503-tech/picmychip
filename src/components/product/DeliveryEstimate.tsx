'use client'

import { Loader2Icon, TruckIcon } from 'lucide-react'
import React, { useState } from 'react'

const PINCODE_PATTERN = /^\d{6}$/

type PostOffice = { Name?: string; District?: string; State?: string }
type PincodeApiResponse = { Status?: string; PostOffice?: PostOffice[] | null }[]

export const DeliveryEstimate: React.FC = () => {
  const [pincode, setPincode] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const checkPincode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!PINCODE_PATTERN.test(pincode)) {
      setResult({ ok: false, message: 'Please enter a valid 6-digit pincode.' })
      return
    }

    setIsChecking(true)
    setResult(null)

    try {
      // Same India Post reverse pincode API AddressForm uses to auto-fill
      // State/District from a typed pincode — confirms the pincode is real
      // (rather than just correctly-shaped) before estimating delivery.
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      const data = (await res.json()) as PincodeApiResponse
      const postOffice = data?.[0]?.PostOffice?.[0]

      if (data?.[0]?.Status !== 'Success' || !postOffice) {
        setResult({ ok: false, message: "We couldn't find that pincode. Please check and try again." })
        return
      }

      const place = [postOffice.District, postOffice.State].filter(Boolean).join(', ')
      setResult({
        ok: true,
        message: `Estimated delivery in 3–5 business days to ${place || pincode}.`,
      })
    } catch {
      setResult({ ok: false, message: 'Could not check that pincode right now — please try again.' })
    } finally {
      setIsChecking(false)
    }
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
        <button className="btn btn-outline btn-sm" disabled={isChecking} type="submit">
          {isChecking ? <Loader2Icon className="size-4 animate-spin" /> : 'Check'}
        </button>
      </form>
      {result && (
        <p className={result.ok ? 'text-success text-sm' : 'text-destructive text-sm'}>{result.message}</p>
      )}
    </div>
  )
}
