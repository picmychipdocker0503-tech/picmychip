import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { StatusPill } from '../StatusPill'

const TONE_BY_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'error' | 'neutral' }> = {
  active: { label: 'Active', tone: 'success' },
  redeemed: { label: 'Redeemed', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'error' },
  disabled: { label: 'Disabled', tone: 'neutral' },
}

export const GiftCardStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = typeof cellData === 'string' ? cellData : undefined
  const config = (status && TONE_BY_STATUS[status]) || { label: status || '—', tone: 'neutral' as const }

  return <StatusPill label={config.label} tone={config.tone} />
}
