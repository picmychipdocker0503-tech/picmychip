import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { StatusPill } from '../StatusPill'

/** No single `status` field on stock-alerts — derives it from whether `notifiedAt` is set. */
export const StockAlertStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const notified = Boolean(cellData)

  return notified ? <StatusPill label="Notified" tone="success" /> : <StatusPill label="Pending" tone="warning" />
}
