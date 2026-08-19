import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { StatusPill } from '../StatusPill'

/** Combines `onSale` + `isClearance` + `saleEndDate` into one status pill — reads rowData since no single field captures all three. */
export const ProductSaleStatusCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const isClearance = Boolean(rowData?.isClearance)
  const onSale = Boolean(rowData?.onSale)
  const saleEndDate = rowData?.saleEndDate as string | undefined
  const isExpired = Boolean(saleEndDate && new Date(saleEndDate).getTime() < Date.now())

  if (isClearance) return <StatusPill label="Clearance" tone="warning" />
  if (onSale && !isExpired) return <StatusPill label="On sale" tone="success" />
  return <StatusPill label="—" tone="neutral" />
}
