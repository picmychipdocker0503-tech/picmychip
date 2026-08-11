import type { Field } from 'payload'

type SelectWithOtherOption = string | { label: string; value: string }

type SelectWithOtherArgs = {
  name: string
  label?: string
  options: SelectWithOtherOption[]
  hasMany?: boolean
  /** Override the generated Postgres enum name when the default (derived from the field path) exceeds the 63-char identifier limit. */
  enumName?: string
}

/**
 * Returns a [select, conditional text] field pair: a select with a trailing
 * "Other" option, plus a sibling free-text field that only shows once "Other"
 * is chosen (or included, when `hasMany`).
 */
export const selectWithOther = ({ name, label, options, hasMany, enumName }: SelectWithOtherArgs): Field[] => {
  const normalizedOptions = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option,
  )

  return [
    {
      name,
      type: 'select',
      label,
      hasMany,
      enumName,
      options: [...normalizedOptions, { label: 'Other', value: 'other' }],
    },
    {
      name: `${name}Other`,
      type: 'text',
      label: label ? `${label} (Other)` : 'Other',
      admin: {
        condition: (_, siblingData) =>
          hasMany
            ? Array.isArray(siblingData?.[name]) && siblingData[name].includes('other')
            : siblingData?.[name] === 'other',
      },
    },
  ]
}
