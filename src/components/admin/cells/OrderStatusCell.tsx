import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { StatusPill } from '../StatusPill'

const TONE_BY_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'error' | 'neutral' }> = {
  processing: { label: 'Processing', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  refunded: { label: 'Refunded', tone: 'error' },
}

export const OrderStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = typeof cellData === 'string' ? cellData : undefined
  const config = (status && TONE_BY_STATUS[status]) || { label: status || '—', tone: 'neutral' as const }

  return <StatusPill label={config.label} tone={config.tone} />
}
