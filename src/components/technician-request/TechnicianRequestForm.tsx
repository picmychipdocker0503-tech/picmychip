'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Send } from 'lucide-react'
import React, { useCallback, useId, useState } from 'react'
import { useForm } from 'react-hook-form'

import { DURATION_OPTIONS, ENGAGEMENT_OPTIONS, SKILL_OPTIONS } from './options'
import { submitTechnicianRequest } from './submitTechnicianRequest'

type FormValues = {
  company: string
  duration: string
  email: string
  engagement: string
  location: string
  message: string
  name: string
  otherSkill: string
  phone: string
  skills: string[]
  startDate: string
  technicians: string
}

const defaultValues: FormValues = {
  company: '',
  duration: '',
  email: '',
  engagement: 'either',
  location: '',
  message: '',
  name: '',
  otherSkill: '',
  phone: '',
  skills: [],
  startDate: '',
  technicians: '1',
}

const textareaClass =
  'border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]'

const selectClass =
  'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]'

const SectionTitle: React.FC<{ children: React.ReactNode; step: number }> = ({ children, step }) => (
  <h3 className="text-foreground flex items-center gap-2.5 text-base font-semibold">
    <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs">
      {step}
    </span>
    {children}
  </h3>
)

export const TechnicianRequestForm: React.FC = () => {
  const formId = useId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<FormValues>({ defaultValues })

  const selectedSkills = watch('skills') ?? []

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const formData = new FormData()
        for (const [key, value] of Object.entries(data)) {
          if (key === 'skills') (value as string[]).forEach((skill) => formData.append('skills', skill))
          else formData.set(key, String(value))
        }

        const result = await submitTechnicianRequest(formData)

        if (result.success) {
          setSuccess(true)
          setTicketId(result.ticketId || null)
          reset()
          document.getElementById('technician-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          setSubmitError(result.error || 'Something went wrong. Please try again.')
        }
      } catch {
        setSubmitError('Something went wrong. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [reset],
  )

  if (success) {
    return (
      <div className="border-border bg-card rounded-2xl border p-10 text-center">
        <CheckCircle2 className="text-primary mx-auto size-10" />
        <h2 className="text-foreground mt-4 text-xl font-bold">Request received</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Our team will review your requirement and call you within one working day to confirm the technician
          profile, schedule and pricing.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {ticketId && (
            <p className="border-border bg-muted/40 text-foreground flex h-9 items-center rounded-lg border px-4 text-sm font-medium">
              Reference ID: <span className="ml-1 font-mono">{ticketId}</span>
            </p>
          )}
          <Button
            onClick={() => {
              setSuccess(false)
              setTicketId(null)
            }}
            variant="outline"
          >
            Submit another request
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="border-border bg-card flex flex-col gap-10 rounded-2xl border p-6 sm:p-8"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* 1 — Skills */}
      <fieldset className="flex flex-col gap-4">
        <legend className="contents">
          <SectionTitle step={1}>What work do you need done?</SectionTitle>
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SKILL_OPTIONS.map((skill) => {
            const checked = selectedSkills.includes(skill)
            return (
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                  checked
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
                key={skill}
              >
                <input className="accent-primary size-4" type="checkbox" value={skill} {...register('skills')} />
                {skill}
              </label>
            )
          })}
        </div>
        <FormItem>
          <Label htmlFor={`${formId}-otherSkill`}>Other skill (optional)</Label>
          <Input id={`${formId}-otherSkill`} placeholder="e.g. Conformal coating" {...register('otherSkill')} />
        </FormItem>
      </fieldset>

      {/* 2 — Engagement */}
      <fieldset className="flex flex-col gap-4">
        <legend className="contents">
          <SectionTitle step={2}>Engagement details</SectionTitle>
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormItem>
            <Label htmlFor={`${formId}-technicians`}>
              Technicians needed <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${formId}-technicians`}
              inputMode="numeric"
              max={500}
              min={1}
              type="number"
              {...register('technicians', {
                required: 'Enter how many technicians you need.',
                validate: (value) => Number(value) >= 1 || 'Enter at least 1.',
              })}
            />
            {errors.technicians && <FormError message={errors.technicians.message} />}
          </FormItem>
          <FormItem>
            <Label htmlFor={`${formId}-duration`}>Duration</Label>
            <select className={selectClass} id={`${formId}-duration`} {...register('duration')}>
              <option value="">Select duration</option>
              {DURATION_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormItem>
          <FormItem>
            <Label htmlFor={`${formId}-location`}>Work location</Label>
            <Input id={`${formId}-location`} placeholder="City or site address" {...register('location')} />
          </FormItem>
          <FormItem>
            <Label htmlFor={`${formId}-startDate`}>Preferred start date</Label>
            <Input id={`${formId}-startDate`} type="date" {...register('startDate')} />
          </FormItem>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Where will they work?</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ENGAGEMENT_OPTIONS.map(({ label, value }) => (
              <label
                className="border-border has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-foreground text-muted-foreground flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition-colors"
                key={value}
              >
                <input className="accent-primary size-4" type="radio" value={value} {...register('engagement')} />
                {label}
              </label>
            ))}
          </div>
        </div>
        <FormItem>
          <Label htmlFor={`${formId}-message`}>Requirement details</Label>
          <textarea
            className={textareaClass}
            id={`${formId}-message`}
            placeholder="Describe the work, boards or equipment involved, shift timings and any certifications needed."
            {...register('message')}
          />
        </FormItem>
      </fieldset>

      {/* 3 — Contact */}
      <fieldset className="flex flex-col gap-4">
        <legend className="contents">
          <SectionTitle step={3}>Your contact details</SectionTitle>
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormItem>
            <Label htmlFor={`${formId}-name`}>
              Full name <span className="text-destructive">*</span>
            </Label>
            <Input autoComplete="name" id={`${formId}-name`} {...register('name', { required: 'Name is required.' })} />
            {errors.name && <FormError message={errors.name.message} />}
          </FormItem>
          <FormItem>
            <Label htmlFor={`${formId}-company`}>Company (optional)</Label>
            <Input autoComplete="organization" id={`${formId}-company`} {...register('company')} />
          </FormItem>
          <FormItem>
            <Label htmlFor={`${formId}-email`}>
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              autoComplete="email"
              id={`${formId}-email`}
              type="email"
              {...register('email', {
                required: 'Email is required.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
              })}
            />
            {errors.email && <FormError message={errors.email.message} />}
          </FormItem>
          <FormItem>
            <Label htmlFor={`${formId}-phone`}>
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              autoComplete="tel"
              id={`${formId}-phone`}
              type="tel"
              {...register('phone', { required: 'Phone number is required.' })}
            />
            {errors.phone && <FormError message={errors.phone.message} />}
          </FormItem>
        </div>
      </fieldset>

      <div className="border-border flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">We&apos;ll call you within one working day to confirm details.</p>
        <Button disabled={isSubmitting} size="lg" type="submit">
          <Send className="size-4" />
          {isSubmitting ? 'Submitting...' : 'Request technicians'}
        </Button>
      </div>
      {submitError && <FormError className="-mt-6" message={submitError} />}
    </form>
  )
}
