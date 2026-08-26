'use client'

import Link from 'next/link'
import React, { useEffect } from 'react'

import { Button } from '@/components/ui/button'

const REDIRECT_DELAY_MS = 3000

export default function NotFound() {
  useEffect(() => {
    // A real navigation, not router.push() — the App Router traps a
    // notFound() boundary in a "not found" router-cache state that a
    // client-side push() doesn't reliably escape. Confirmed live: it was
    // repeatedly hard-reloading this same /category URL forever (the
    // Tawk.to widget script re-injecting on every cycle proved each one was
    // a genuine full document reload, not a soft nav) and never actually
    // reaching the homepage.
    const timer = setTimeout(() => {
      window.location.href = '/'
    }, REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

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
