'use client'

import type { TextFieldClientComponent } from 'payload'

import { Button, TextInput, useField } from '@payloadcms/ui'
import React from 'react'

// Excludes visually ambiguous characters (0/O, 1/I/L).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

const generateCode = () =>
  Array.from({ length: 8 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')

/**
 * Drop-in replacement for the default text field via a field's
 * `admin.components.Field` — reuses Payload's own `TextInput` chrome
 * (label/description/error) and only adds a "Generate" button via `AfterInput`.
 */
export const GenerateCodeField: TextFieldClientComponent = ({ field, path }) => {
  const { setValue, showError, value } = useField<string>({ path })

  return (
    <TextInput
      AfterInput={
        <Button buttonStyle="secondary" onClick={() => setValue(generateCode())} size="small">
          Generate
        </Button>
      }
      description={field.admin?.description}
      label={field.label}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value.toUpperCase())}
      path={path}
      required={field.required}
      showError={showError}
      value={value || ''}
    />
  )
}
