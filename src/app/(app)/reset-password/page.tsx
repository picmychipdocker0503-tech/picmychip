import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React, { Suspense } from 'react'

import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="container py-16">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Choose a new password for your Picmychip account.',
  openGraph: mergeOpenGraph({
    title: 'Reset Password',
    url: '/reset-password',
  }),
  title: 'Reset Password',
}
