'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

import { Button } from '@/components/ui/button'

const REDIRECT_DELAY_MS = 3000

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push('/'), REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="container py-28">
      <div className="prose max-w-none">
        <h1 style={{ marginBottom: 0 }}>404</h1>
        <p className="mb-4">This page could not be found. Redirecting you to the homepage…</p>
      </div>
      <Button asChild variant="default">
        <Link href="/">Go home now</Link>
      </Button>
    </div>
  )
}
