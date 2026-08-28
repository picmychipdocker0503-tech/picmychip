import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import React from 'react'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { CreateAccountForm } from '@/components/forms/CreateAccountForm'
import { redirect } from 'next/navigation'

export default async function CreateAccount() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <div className="container py-16">
      <h1 className="text-xl mb-4">Create Account</h1>
      <RenderParams />
      <CreateAccountForm />
    </div>
  )
}

export const metadata: Metadata = {
  alternates: {
    canonical: `${getServerSideURL()}/create-account`,
  },
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  robots: { index: false, follow: true },
  title: 'Account',
}
