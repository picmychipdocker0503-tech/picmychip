import React from 'react'

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

type Props = {
  label: string
  tone: Tone
}

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  info: 'bg-info/40 text-info-content',
  neutral: 'bg-base-content/10 text-base-content/70',
}

/** Small colored status pill, matching the mockup's "In stock"/"Active"/"Draft" badges. */
export const StatusPill: React.FC<Props> = ({ label, tone }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${TONE_CLASSES[tone]}`}>
    {label}
  </span>
)
