'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import React, { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  password: string
}

export const LoginForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const redirect = useRef(searchParams.get('redirect'))
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState<null | string>(null)
  const [success, setSuccess] = React.useState<null | string>(null)
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<null | string>(null)
  const [resendingVerification, setResendingVerification] = React.useState(false)

  const {
    formState: { errors, isLoading },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      let user
      try {
        setSuccess(null)
        setUnverifiedEmail(null)
        user = await login(data)
      } catch (e) {
        const message =
          e instanceof Error && e.message
            ? e.message
            : 'There was an error with the credentials provided. Please try again.'
        setError(message)
        if (message.toLowerCase().includes('verify your email')) {
          setUnverifiedEmail(data.email)
        }
        return
      }

      setError(null)

      try {
        posthog.identify(String(user.id), { email: user.email })
        posthog.capture('user_logged_in')
      } catch {
        // Analytics must never block a successful login.
      }

      if (redirect?.current) router.push(redirect.current)
      else router.push('/account')
    },
    [login, router],
  )

  const resendVerificationEmail = useCallback(async () => {
    if (!unverifiedEmail) return

    setResendingVerification(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/users/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        setError(body?.message || 'Unable to send verification email right now.')
        return
      }

      setSuccess('Verification email sent. Please check your inbox and spam folder.')
    } finally {
      setResendingVerification(false)
    }
  }, [unverifiedEmail])

  return (
    <form className="" onSubmit={handleSubmit(onSubmit)}>
      <Message className="classes.message" error={error} success={success} />
      {unverifiedEmail && (
        <div className="-mt-4 mb-8">
          <Button
            disabled={resendingVerification}
            onClick={resendVerificationEmail}
            type="button"
            variant="outline"
          >
            {resendingVerification ? 'Sending verification email...' : 'Send verification email again'}
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-8">
        <FormItem>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email', { required: 'Email is required.' })}
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password', { required: 'Please provide a password.' })}
          />
          {errors.password && <FormError message={errors.password.message} />}
        </FormItem>

        <div className="text-primary/70 mb-6 prose prose-a:hover:text-primary dark:prose-invert">
          <p>
            Forgot your password?{' '}
            <Link href={`/forgot-password${allParams}`}>Click here to reset it</Link>
          </p>
        </div>
      </div>

      <div className="flex gap-4 justify-between">
        <Button asChild variant="outline" size="lg">
          <Link href={`/create-account${allParams}`} className="grow max-w-[50%]">
            Create an account
          </Link>
        </Button>
        <Button className="grow" disabled={isLoading} size="lg" type="submit" variant="default">
          {isLoading ? 'Processing' : 'Continue'}
        </Button>
      </div>
    </form>
  )
}
