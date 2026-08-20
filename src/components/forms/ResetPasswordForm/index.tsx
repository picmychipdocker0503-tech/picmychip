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
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type FormData = {
  password: string
  passwordConfirm: string
}

export const ResetPasswordForm: React.FC = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { resetPassword } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<null | string>(null)

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!token) return
      setError(null)

      try {
        await resetPassword({ ...data, token })
        toast.success('Password reset. You are now logged in.')
        router.push('/account')
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'This link is invalid or has expired. Please request a new one.',
        )
      }
    },
    [resetPassword, router, token],
  )

  if (!token) {
    return (
      <div className="prose dark:prose-invert max-w-lg">
        <h1 className="text-xl mb-4">Invalid link</h1>
        <p>
          This password reset link is missing or malformed.{' '}
          <Link href="/forgot-password">Request a new one</Link>.
        </p>
      </div>
    )
  }

  return (
    <form className="max-w-lg" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl mb-4">Reset password</h1>
      <Message className="mb-8" error={error} />

      <div className="flex flex-col gap-8 mb-8">
        <FormItem>
          <Label htmlFor="password" className="mb-2">
            New password
          </Label>
          <Input
            id="password"
            {...register('password', { required: 'Password is required.' })}
            type="password"
          />
          {errors.password && <FormError message={errors.password.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="passwordConfirm" className="mb-2">
            Confirm password
          </Label>
          <Input
            id="passwordConfirm"
            {...register('passwordConfirm', {
              required: 'Please confirm your password.',
              validate: (value) => value === password.current || 'The passwords do not match',
            })}
            type="password"
          />
          {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
        </FormItem>
      </div>

      <Button disabled={isSubmitting} type="submit" variant="default">
        {isSubmitting ? 'Resetting...' : 'Reset password'}
      </Button>
    </form>
  )
}
