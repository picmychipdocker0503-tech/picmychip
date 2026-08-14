import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { StatusPill } from '../StatusPill'

/** Payload's auto-injected `_status` field (draft/published), as a colored pill. */
export const DocStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const isPublished = cellData === 'published'

  return <StatusPill label={isPublished ? 'Published' : 'Draft'} tone={isPublished ? 'success' : 'neutral'} />
}
