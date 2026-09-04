'use client'

import type { NumberFieldClientComponent } from 'payload'

import { FieldDescription, FieldError, FieldLabel, fieldBaseClass, useField } from '@payloadcms/ui'
import React, { useState } from 'react'

/**
 * Drop-in replacement for the default number field via a field's
 * `admin.components.Field` — the underlying value is stored/read everywhere
 * else in paise (matching every other price field in this app), but this
 * widget displays and edits it as rupees, so admins never have to do the
 * ×100/÷100 mental math themselves.
 */
export const RupeeRateField: NumberFieldClientComponent = ({ field, path, readOnly }) => {
  const { setValue, showError, value } = useField<number>({ path })

  const paise = typeof value === 'number' ? value : undefined
  const rupeesText = paise === undefined ? '' : (paise / 100).toString()

  // Mirrors the same "separate text buffer from the committed number" pattern
  // used by src/components/Cart/AddToCart.tsx's quantity input — a number
  // input bound straight to a derived value can't show a mid-edit state like
  // a trailing "." or a single deleted digit.
  const [text, setText] = useState(rupeesText)
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className={[fieldBaseClass, 'number', showError && 'error', readOnly && 'read-only'].filter(Boolean).join(' ')}>
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError path={path} showError={showError} />
        <div>
          <input
            disabled={readOnly}
            id={`field-${path.replace(/\./g, '__')}`}
            min={0}
            name={path}
            onBlur={() => setIsEditing(false)}
            onChange={(e) => {
              setText(e.target.value)
              const parsed = Number.parseFloat(e.target.value)
              setValue(Number.isNaN(parsed) ? null : Math.round(parsed * 100))
            }}
            onFocus={() => setIsEditing(true)}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="0.00"
            step={0.01}
            type="number"
            value={isEditing ? text : rupeesText}
          />
        </div>
        <FieldDescription description={field.admin?.description} path={path} />
      </div>
    </div>
  )
}
