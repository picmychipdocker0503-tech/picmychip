import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { StatusPill } from '../StatusPill'

const TONE_BY_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'error' | 'neutral' }> = {
  'in-stock': { label: 'In stock', tone: 'success' },
  'low-stock': { label: 'Low stock', tone: 'warning' },
  'out-of-stock': { label: 'Out of stock', tone: 'error' },
  backorder: { label: 'Backorder', tone: 'neutral' },
}

export const ProductStockCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = typeof cellData === 'string' ? cellData : undefined
  const config = (status && TONE_BY_STATUS[status]) || { label: status || '—', tone: 'neutral' as const }

  return <StatusPill label={config.label} tone={config.tone} />
}
