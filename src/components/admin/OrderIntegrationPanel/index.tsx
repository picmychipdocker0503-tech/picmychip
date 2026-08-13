'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useState } from 'react'

type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed' | undefined

const StatusBadge: React.FC<{ status: SyncStatus }> = ({ status }) => {
  const label = status ? status[0].toUpperCase() + status.slice(1) : 'Pending'
  const color =
    status === 'completed'
      ? 'text-success'
      : status === 'failed'
        ? 'text-error'
        : status === 'processing'
          ? 'text-warning'
          : 'text-base-content/60'

  return <span className={`text-sm font-medium ${color}`}>{label}</span>
}

/**
 * Rendered via the Orders collection's `admin.components.edit.beforeDocumentControls`
 * (same slot CouponUsageSummary uses on Coupons). Shows Zoho invoice and
 * Shiprocket shipment sync status with manual retry/cancel actions that call
 * the /api/admin/orders/[id]/* routes — a full page reload afterwards keeps
 * this simple and always shows the true persisted state.
 */
export const OrderIntegrationPanel: React.FC = () => {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState<'invoice' | 'shipment' | 'cancel' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const invoiceSyncStatus = useFormFields(([fields]) => fields.invoiceSyncStatus?.value) as SyncStatus
  const zohoInvoiceNumber = useFormFields(([fields]) => fields.zohoInvoiceNumber?.value) as string | undefined
  const zohoInvoiceUrl = useFormFields(([fields]) => fields.zohoInvoiceUrl?.value) as string | undefined
  const invoiceError = useFormFields(([fields]) => fields['integrationError.invoice']?.value) as
    | string
    | undefined

  const shipmentSyncStatus = useFormFields(([fields]) => fields.shipmentSyncStatus?.value) as SyncStatus
  const shiprocketOrderId = useFormFields(([fields]) => fields.shiprocketOrderId?.value) as string | undefined
  const trackingNumber = useFormFields(([fields]) => fields.trackingNumber?.value) as string | undefined
  const courierName = useFormFields(([fields]) => fields.courierName?.value) as string | undefined
  const shipmentStatus = useFormFields(([fields]) => fields.shipmentStatus?.value) as string | undefined
  const shiprocketTrackingUrl = useFormFields(([fields]) => fields.shiprocketTrackingUrl?.value) as
    | string
    | undefined
  const shipmentError = useFormFields(([fields]) => fields['integrationError.shipment']?.value) as
    | string
    | undefined

  const callAction = async (action: 'retry-invoice' | 'retry-shipment' | 'cancel-shipment', key: typeof loading) => {
    if (!id) return
    setLoading(key)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}/${action}`, { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed.')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(null)
    }
  }

  return (
    <div className="pmc-rounded-box border-base-content/10 bg-base-200/40 mb-4 flex flex-col gap-4 border p-4">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-base-content text-sm font-medium">Zoho Books Invoice</span>
          <StatusBadge status={invoiceSyncStatus} />
        </div>
        {zohoInvoiceNumber && <p className="text-base-content/70 text-sm">{zohoInvoiceNumber}</p>}
        {invoiceSyncStatus === 'failed' && invoiceError && (
          <p className="text-error mt-1 text-xs break-words">{invoiceError}</p>
        )}
        <div className="mt-2 flex gap-2">
          {zohoInvoiceUrl && (
            <a
              className="pmc-btn pmc-btn-xs pmc-btn-outline"
              href={zohoInvoiceUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              View Invoice
            </a>
          )}
          <button
            className="pmc-btn pmc-btn-xs"
            disabled={loading !== null}
            onClick={() => callAction('retry-invoice', 'invoice')}
            type="button"
          >
            {loading === 'invoice' ? 'Retrying…' : 'Retry Invoice'}
          </button>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-base-content text-sm font-medium">Shiprocket Shipment</span>
          <StatusBadge status={shipmentSyncStatus} />
        </div>
        {shiprocketOrderId && (
          <p className="text-base-content/70 text-sm">
            Order {shiprocketOrderId}
            {courierName ? ` · ${courierName}` : ''}
            {trackingNumber ? ` · AWB ${trackingNumber}` : ''}
          </p>
        )}
        {shipmentStatus && <p className="text-base-content/70 text-sm">{shipmentStatus}</p>}
        {shipmentSyncStatus === 'failed' && shipmentError && (
          <p className="text-error mt-1 text-xs break-words">{shipmentError}</p>
        )}
        <div className="mt-2 flex gap-2">
          {shiprocketTrackingUrl && (
            <a
              className="pmc-btn pmc-btn-xs pmc-btn-outline"
              href={shiprocketTrackingUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Track
            </a>
          )}
          <button
            className="pmc-btn pmc-btn-xs"
            disabled={loading !== null}
            onClick={() => callAction('retry-shipment', 'shipment')}
            type="button"
          >
            {loading === 'shipment' ? 'Retrying…' : 'Retry Shipment'}
          </button>
          {shiprocketOrderId && (
            <button
              className="pmc-btn pmc-btn-xs pmc-btn-outline"
              disabled={loading !== null}
              onClick={() => callAction('cancel-shipment', 'cancel')}
              type="button"
            >
              {loading === 'cancel' ? 'Cancelling…' : 'Cancel Shipment'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-error text-xs">{error}</p>}
    </div>
  )
}
