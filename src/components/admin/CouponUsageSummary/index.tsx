'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

/**
 * Rendered via a collection's `admin.components.edit.beforeDocumentControls`,
 * above the save/publish controls on the edit view. Reads live (unsaved)
 * form state, not just the persisted doc, so it updates as maxRedemptions changes.
 */
export const CouponUsageSummary: React.FC = () => {
  const redemptionCount = useFormFields(([fields]) => fields.redemptionCount?.value) as number | undefined
  const maxRedemptions = useFormFields(([fields]) => fields.maxRedemptions?.value) as number | undefined

  const used = redemptionCount ?? 0
  const max = typeof maxRedemptions === 'number' && maxRedemptions > 0 ? maxRedemptions : undefined
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0

  return (
    <div className="pmc-rounded-box border-base-content/10 bg-base-200/40 mb-4 border p-4">
      <div className="flex items-center justify-between">
        <span className="text-base-content text-sm font-medium">Redemptions</span>
        <span className="text-base-content/70 text-sm">{max ? `${used} / ${max}` : `${used} (unlimited)`}</span>
      </div>
      {max ? <progress className="pmc-progress pmc-progress-primary mt-2 w-full" max={100} value={pct} /> : null}
    </div>
  )
}
