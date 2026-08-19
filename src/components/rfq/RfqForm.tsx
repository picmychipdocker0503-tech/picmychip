'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileSpreadsheet, Plus, Send, Trash2, X } from 'lucide-react'
import React, { useCallback, useId, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { submitRfq } from './submitRfq'

type LineItemFields = {
  mpn: string
  manufacturer: string
  quantity: string
  targetPrice: string
  leadTime: string
}

type ContactFields = {
  email: string
  firstName: string
  lastName: string
  company: string
  phone: string
  message: string
}

type FormValues = ContactFields & { lineItems: LineItemFields[] }

const emptyRow: LineItemFields = { mpn: '', manufacturer: '', quantity: '', targetPrice: '', leadTime: '' }

type Props = {
  file: File | null
  onRemoveFile: () => void
}

export const RfqForm: React.FC<Props> = ({ file, onRemoveFile }) => {
  const formId = useId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      company: '',
      phone: '',
      message: '',
      lineItems: [emptyRow],
    },
  })

  const { append, fields, remove } = useFieldArray({ control, name: 'lineItems' })

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const formData = new FormData()
        formData.set('email', data.email)
        formData.set('firstName', data.firstName)
        formData.set('lastName', data.lastName)
        formData.set('company', data.company)
        formData.set('phone', data.phone)
        formData.set('message', data.message)
        formData.set('lineItems', JSON.stringify(data.lineItems))
        if (file) formData.set('file', file)

        const result = await submitRfq(formData)

        if (result.success) {
          setSuccess(true)
          reset()
          onRemoveFile()
        } else {
          setSubmitError(result.error || 'Something went wrong. Please try again.')
        }
      } catch {
        setSubmitError('Something went wrong. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [file, onRemoveFile, reset],
  )

  if (success) {
    return (
      <section className="container my-16" id="rfq-form">
        <div className="border-border bg-card mx-auto max-w-xl rounded-2xl border p-10 text-center">
          <h2 className="text-foreground text-xl font-bold">Request received</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {"We've logged your RFQ and will get back to you within 12 hours with pricing and availability."}
          </p>
          <Button className="mt-6" onClick={() => setSuccess(false)} variant="outline">
            Submit another request
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="container my-16 scroll-mt-24" id="rfq-form">
      <form className="mx-auto max-w-4xl" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-foreground text-2xl font-bold tracking-tight">Submit your requirements</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Add part numbers below, attach a BOM, or both — either way our team will follow up with a quote.
        </p>

        {file && (
          <div className="border-border bg-muted/40 mt-6 flex items-center justify-between gap-3 rounded-xl border p-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileSpreadsheet className="text-primary size-5 shrink-0" />
              <span className="truncate text-sm font-medium text-foreground">{file.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            </div>
            <button
              aria-label="Remove attached file"
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={onRemoveFile}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="border-border mt-6 overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Target Price</TableHead>
                <TableHead>Target Lead Time</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <Input placeholder="e.g. STM32F103C8T6" {...register(`lineItems.${index}.mpn`)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="e.g. STMicroelectronics" {...register(`lineItems.${index}.manufacturer`)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Qty" {...register(`lineItems.${index}.quantity`)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="₹" {...register(`lineItems.${index}.targetPrice`)} />
                  </TableCell>
                  <TableCell>
                    <Input placeholder="Working days" {...register(`lineItems.${index}.leadTime`)} />
                  </TableCell>
                  <TableCell>
                    {fields.length > 1 && (
                      <button
                        aria-label={`Remove line ${index + 1}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button
          className="mt-3"
          onClick={() => append(emptyRow)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          Add Row
        </Button>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <FormItem>
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              id={`${formId}-email`}
              type="email"
              {...register('email', { required: 'Email is required.' })}
            />
            {errors.email && <FormError message={errors.email.message} />}
          </FormItem>
          <FormItem>
            <Label htmlFor={`${formId}-phone`}>Phone (optional)</Label>
            <Input id={`${formId}-phone`} type="tel" {...register('phone')} />
          </FormItem>
          <FormItem>
            <Label htmlFor={`${formId}-firstName`}>First name</Label>
            <Input id={`${formId}-firstName`} {...register('firstName', { required: 'First name is required.' })} />
            {errors.firstName && <FormError message={errors.firstName.message} />}
          </FormItem>
          <FormItem>
            <Label htmlFor={`${formId}-lastName`}>Last name</Label>
            <Input id={`${formId}-lastName`} {...register('lastName', { required: 'Last name is required.' })} />
            {errors.lastName && <FormError message={errors.lastName.message} />}
          </FormItem>
          <FormItem className="sm:col-span-2">
            <Label htmlFor={`${formId}-company`}>Company name</Label>
            <Input id={`${formId}-company`} {...register('company', { required: 'Company name is required.' })} />
            {errors.company && <FormError message={errors.company.message} />}
          </FormItem>
          <FormItem className="sm:col-span-2">
            <Label htmlFor={`${formId}-message`}>Message (optional)</Label>
            <textarea
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              id={`${formId}-message`}
              {...register('message')}
            />
          </FormItem>
        </div>

        {submitError && <FormError message={submitError} className="mt-4" />}

        <Button className="mt-6" disabled={isSubmitting} size="lg" type="submit" variant="default">
          <Send className="size-4" />
          {isSubmitting ? 'Submitting...' : 'Submit RFQ'}
        </Button>
      </form>
    </section>
  )
}
