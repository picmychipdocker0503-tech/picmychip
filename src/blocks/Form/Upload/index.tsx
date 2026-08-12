import type { UploadField } from '@payloadcms/plugin-form-builder/types'
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'

import { Label } from '@/components/ui/label'
import React from 'react'

import { Width } from '../Width'
import { FormItem } from '@/components/forms/FormItem'
import { FormError } from '@/components/forms/FormError'
import { capitaliseFirstLetter } from '@/utilities/capitaliseFirstLetter'

export const Upload: React.FC<
  UploadField & {
    errors: Partial<
      FieldErrorsImpl<{
        [x: string]: any
      }>
    >
    register: UseFormRegister<FieldValues>
  }
> = ({ name, errors, label, mimeTypes, multiple, register, required: requiredFromProps, width }) => {
  const accept = mimeTypes?.map((entry) => entry.mimeType).join(',')

  return (
    <Width width={width}>
      <FormItem>
        <Label htmlFor={name}>{label}</Label>
        <input
          accept={accept}
          className="border-input file:bg-muted file:text-foreground w-full rounded-[0.3rem] border bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-[0.2rem] file:border-0 file:px-2.5 file:py-1 file:text-xs"
          id={name}
          multiple={multiple ?? false}
          type="file"
          {...register(name, {
            required: requiredFromProps
              ? `${capitaliseFirstLetter(label || name)} is required.`
              : undefined,
          })}
        />

        {errors?.[name]?.message && typeof errors?.[name]?.message === 'string' && (
          <FormError message={errors?.[name]?.message} />
        )}
      </FormItem>
    </Width>
  )
}
