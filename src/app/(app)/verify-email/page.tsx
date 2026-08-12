import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React, { Suspense } from 'react'

import { VerifyEmailStatus } from '@/components/forms/VerifyEmailStatus'

export default function VerifyEmailPage() {
  return (
    <div className="container py-16">
      <Suspense fallback={null}>
        <VerifyEmailStatus />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Verify your email address to activate your Picmychip account.',
  openGraph: mergeOpenGraph({
    title: 'Verify Email',
    url: '/verify-email',
  }),
  title: 'Verify Email',
}
