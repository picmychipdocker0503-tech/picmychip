import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { StatusPill } from '../StatusPill'

const TONE_BY_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'error' | 'neutral' }> = {
  requested: { label: 'Requested', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'error' },
  completed: { label: 'Completed', tone: 'success' },
}

export const ReturnStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = typeof cellData === 'string' ? cellData : undefined
  const config = (status && TONE_BY_STATUS[status]) || { label: status || '—', tone: 'neutral' as const }

  return <StatusPill label={config.label} tone={config.tone} />
}
