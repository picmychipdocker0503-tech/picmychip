'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { getClientSideURL } from '@/utilities/getURL'

type Status = 'pending' | 'success' | 'error'

export const VerifyEmailStatus: React.FC = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>(token ? 'pending' : 'error')

  useEffect(() => {
    if (!token) return

    let cancelled = false

    const verify = async () => {
      try {
        const response = await fetch(`${getClientSideURL()}/api/users/verify/${token}`, {
          method: 'POST',
        })
        if (!cancelled) setStatus(response.ok ? 'success' : 'error')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void verify()

    return () => {
      cancelled = true
    }
  }, [token])

  if (status === 'pending') {
    return (
      <div className="prose dark:prose-invert">
        <p>Verifying your email…</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="prose dark:prose-invert">
        <h1 className="text-xl mb-4">Email verified</h1>
        <p>
          Your account is now active. <Link href="/login">Log in</Link> to continue.
        </p>
      </div>
    )
  }

  return (
    <div className="prose dark:prose-invert">
      <h1 className="text-xl mb-4">Verification failed</h1>
      <p>
        This link is invalid or has expired. <Link href="/create-account">Create an account</Link> again, or{' '}
        <Link href="/login">log in</Link> if you're already verified.
      </p>
    </div>
  )
}
