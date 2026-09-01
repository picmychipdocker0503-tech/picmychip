import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import React from 'react'

import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { LoginForm } from '@/components/forms/LoginForm'
import { getServerSideURL } from '@/utilities/getURL'
import { redirect } from 'next/navigation'

export default async function Login() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <div className="container">
      <div className="max-w-xl mx-auto my-12">
        <RenderParams />

        <h1 className="mb-4 text-[1.8rem]">Log in</h1>
        <p className="mb-8">
          {'Log in to manage your account, review your order history, and more.'}
        </p>
        <LoginForm />
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  alternates: {
    canonical: `${getServerSideURL()}/login`,
  },
  description: 'Login or create an account to get started.',
  openGraph: {
    title: 'Login',
    url: '/login',
  },
  robots: { index: false, follow: true },
  title: 'Login',
}
