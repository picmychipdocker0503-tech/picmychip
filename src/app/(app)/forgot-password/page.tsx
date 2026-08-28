import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import React from 'react'

import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'

export default async function ForgotPasswordPage() {
  return (
    <div className="container py-16">
      <ForgotPasswordForm />
    </div>
  )
}

export const metadata: Metadata = {
  alternates: {
    canonical: `${getServerSideURL()}/forgot-password`,
  },
  description: 'Enter your email address to recover your password.',
  openGraph: mergeOpenGraph({
    title: 'Forgot Password',
    url: '/forgot-password',
  }),
  robots: { index: false, follow: true },
  title: 'Forgot Password',
}
