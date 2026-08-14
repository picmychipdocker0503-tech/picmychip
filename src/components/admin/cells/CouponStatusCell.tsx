import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { StatusPill } from '../StatusPill'

/** Combines `active` + `expiresAt` into one status pill — reads rowData since no single field captures both. */
export const CouponStatusCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const active = Boolean(rowData?.active)
  const expiresAt = rowData?.expiresAt as string | undefined
  const isExpired = Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now())

  if (isExpired) return <StatusPill label="Expired" tone="error" />
  if (!active) return <StatusPill label="Disabled" tone="neutral" />
  return <StatusPill label="Active" tone="success" />
}
