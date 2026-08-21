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

type Action = 'retry-sales-order' | 'accept-sales-order'

type ActionResponse = {
  error?: string
  invoiceSyncStatus?: string
  salesOrderSyncStatus?: string
  zohoInvoiceNumber?: string
  zohoSalesOrderId?: string
  zohoSalesOrderNumber?: string
}

async function readActionResponse(res: Response): Promise<ActionResponse> {
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return (await res.json()) as ActionResponse
  }

  const text = await res.text().catch(() => '')
  return {
    error:
      text.trim() ||
      `Production returned ${res.status} ${res.statusText || 'without a readable error body.'}`,
  }
}

/**
 * Rendered via the Orders collection's `admin.components.edit.beforeDocumentControls`
 * (same slot CouponUsageSummary uses on Coupons). Shows the Zoho sales
 * order → invoice pipeline (every order becomes a sales order first; an
 * admin "Accepts" it here — or it's picked up automatically if accepted
 * directly in Zoho Books — to generate the actual invoice) and the
 * manual courier details, with retry actions that call the
 * /api/admin/orders/[id]/* routes — a full page reload afterwards keeps this
 * simple and always shows the true persisted state.
 */
export const OrderIntegrationPanel: React.FC = () => {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState<Action | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<ActionResponse | null>(null)

  const salesOrderSyncStatus = useFormFields(([fields]) => fields.salesOrderSyncStatus?.value) as SyncStatus
  const zohoSalesOrderNumber = useFormFields(([fields]) => fields.zohoSalesOrderNumber?.value) as
    | string
    | undefined
  const zohoSalesOrderStatus = useFormFields(([fields]) => fields.zohoSalesOrderStatus?.value) as
    | string
    | undefined
  const salesOrderError = useFormFields(([fields]) => fields['integrationError.salesOrder']?.value) as
    | string
    | undefined

  const invoiceSyncStatus = useFormFields(([fields]) => fields.invoiceSyncStatus?.value) as SyncStatus
  const zohoInvoiceNumber = useFormFields(([fields]) => fields.zohoInvoiceNumber?.value) as string | undefined
  const zohoInvoiceUrl = useFormFields(([fields]) => fields.zohoInvoiceUrl?.value) as string | undefined
  const paymentReference = useFormFields(([fields]) => fields.paymentReference?.value) as string | undefined
  const zohoPaymentRecordedAt = useFormFields(([fields]) => fields.zohoPaymentRecordedAt?.value) as
    | string
    | undefined
  const zohoCreditNoteNumber = useFormFields(([fields]) => fields.zohoCreditNoteNumber?.value) as
    | string
    | undefined
  const zohoCreditNoteStatus = useFormFields(([fields]) => fields.zohoCreditNoteStatus?.value) as
    | string
    | undefined
  const zohoCreditNoteUrl = useFormFields(([fields]) => fields.zohoCreditNoteUrl?.value) as
    | string
    | undefined
  const invoiceError = useFormFields(([fields]) => fields['integrationError.invoice']?.value) as
    | string
    | undefined

  const trackingNumber = useFormFields(([fields]) => fields.trackingNumber?.value) as string | undefined
  const courierName = useFormFields(([fields]) => fields.courierName?.value) as string | undefined
  const shipmentStatus = useFormFields(([fields]) => fields.shipmentStatus?.value) as string | undefined
  const trackingUrl = useFormFields(([fields]) => fields.shiprocketTrackingUrl?.value) as
    | string
    | undefined

  const callAction = async (action: Action) => {
    if (!id) return
    setLoading(action)
    setError(null)
    setLastResponse(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}/${action}`, { method: 'POST', credentials: 'include' })
      const data = await readActionResponse(res)
      setLastResponse(data)
      if (!res.ok) throw new Error(data.error || 'Request failed.')
      if (data.salesOrderSyncStatus === 'completed' || data.invoiceSyncStatus === 'completed') {
        window.location.reload()
        return
      }
      setError(data.error || 'The request finished, but Zoho did not return a completed status.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  const hasInvoice = invoiceSyncStatus === 'completed' && Boolean(zohoInvoiceNumber)

  return (
    <div className="pmc-rounded-box border-base-content/10 bg-base-200/40 mb-4 flex flex-col gap-4 border p-4">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-base-content text-sm font-medium">Zoho Sales Order</span>
          <StatusBadge status={salesOrderSyncStatus} />
        </div>
        {zohoSalesOrderNumber && (
          <p className="text-base-content/70 text-sm">
            {zohoSalesOrderNumber}
            {zohoSalesOrderStatus ? ` · ${zohoSalesOrderStatus}` : ''}
          </p>
        )}
        {salesOrderSyncStatus === 'failed' && salesOrderError && (
          <p className="text-error mt-1 text-xs break-words">{salesOrderError}</p>
        )}
        {error && <p className="text-error mt-2 text-xs break-words">{error}</p>}
        {lastResponse && (
          <div className="bg-base-100/70 border-base-content/10 mt-2 rounded border p-2 text-xs">
            <p className="font-medium">Last retry result</p>
            <p>Sales order: {lastResponse.salesOrderSyncStatus || 'unknown'}</p>
            {lastResponse.zohoSalesOrderNumber && <p>Zoho SO: {lastResponse.zohoSalesOrderNumber}</p>}
            {lastResponse.zohoSalesOrderId && <p>Zoho ID: {lastResponse.zohoSalesOrderId}</p>}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <button
            className="pmc-btn pmc-btn-xs"
            disabled={loading !== null}
            onClick={() => callAction('retry-sales-order')}
            type="button"
          >
            {loading === 'retry-sales-order' ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-base-content text-sm font-medium">Zoho Books Invoice</span>
          <StatusBadge status={invoiceSyncStatus} />
        </div>
        {hasInvoice ? (
          <>
            <p className="text-base-content/70 text-sm">{zohoInvoiceNumber}</p>
            {paymentReference && (
              <p className="text-base-content/70 text-xs">
                PayU reference {paymentReference}
                {zohoPaymentRecordedAt ? ' · payment recorded in Zoho' : ''}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              {zohoInvoiceUrl && (
                <a
                  className="pmc-btn pmc-btn-xs pmc-btn-outline"
                  href={zohoInvoiceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View in Zoho
                </a>
              )}
              {id && (
                <a className="pmc-btn pmc-btn-xs pmc-btn-outline" href={`/api/orders/${id}/invoice-pdf`}>
                  Download PDF
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-base-content/70 text-sm">
              Not yet accepted — confirm stock/availability, then accept to generate the invoice. Also
              auto-detected here if accepted directly in Zoho Books.
            </p>
            {invoiceSyncStatus === 'failed' && invoiceError && (
              <p className="text-error mt-1 text-xs break-words">{invoiceError}</p>
            )}
            <div className="mt-2 flex gap-2">
              <button
                className="pmc-btn pmc-btn-xs"
                disabled={loading !== null || !zohoSalesOrderNumber}
                onClick={() => callAction('accept-sales-order')}
                type="button"
              >
                {loading === 'accept-sales-order' ? 'Accepting…' : 'Accept & Generate Invoice'}
              </button>
            </div>
          </>
        )}
      </div>

      {zohoCreditNoteNumber && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-base-content text-sm font-medium">Zoho Credit Note</span>
            <span className="text-base-content/60 text-sm font-medium">
              {zohoCreditNoteStatus || 'Linked'}
            </span>
          </div>
          <p className="text-base-content/70 text-sm">{zohoCreditNoteNumber}</p>
          <div className="mt-2 flex gap-2">
            {zohoCreditNoteUrl && (
              <a
                className="pmc-btn pmc-btn-xs pmc-btn-outline"
                href={zohoCreditNoteUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                View in Zoho
              </a>
            )}
            {id && (
              <a className="pmc-btn pmc-btn-xs pmc-btn-outline" href={`/api/orders/${id}/credit-note-pdf`}>
                Download PDF
              </a>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-base-content text-sm font-medium">Manual Courier</span>
        </div>
        {trackingNumber || courierName || shipmentStatus ? (
          <p className="text-base-content/70 text-sm">
            {courierName || 'Courier'}
            {trackingNumber ? ` · AWB ${trackingNumber}` : ''}
          </p>
        ) : (
          <p className="text-base-content/70 text-sm">
            Choose the courier manually after invoice generation, then enter courier name, tracking number,
            tracking URL, and shipment status in the sidebar.
          </p>
        )}
        {shipmentStatus && <p className="text-base-content/70 text-xs">{shipmentStatus}</p>}
        <div className="mt-2 flex gap-2">
          {trackingUrl && (
            <a
              className="pmc-btn pmc-btn-xs pmc-btn-outline"
              href={trackingUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Track
            </a>
          )}
        </div>
      </div>

      {error && <p className="text-error text-xs">{error}</p>}
    </div>
  )
}
