'use client'

import { StatusPill } from '@/components/admin/StatusPill'
import { AlertTriangleIcon, DownloadIcon, Loader2Icon, UploadIcon } from 'lucide-react'
import React, { useState } from 'react'

type PreviewRow = {
  rowNumber: number
  action: 'create' | 'update' | 'error'
  sku?: string
  title?: string
  errors: string[]
}

type PreviewResponse = {
  truncated: boolean
  rows: PreviewRow[]
}

type CommitResponse = {
  created: number
  updated: number
  failed: { rowNumber: number; title?: string; error: string }[]
}

const ACTION_TONE = {
  create: 'success',
  update: 'info',
  error: 'error',
} as const

export const BulkProductsUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (commit: boolean) => {
    if (!file) return
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('commit', String(commit))

      const res = await fetch('/api/admin/bulk-products', { method: 'POST', body: formData, credentials: 'include' })
      const json = await res.json()

      if (!res.ok) {
        setError(json?.error || 'Something went wrong.')
        return
      }

      if (commit) {
        setCommitResult(json as CommitResponse)
        setPreview(null)
      } else {
        setPreview(json as PreviewResponse)
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const createCount = preview?.rows.filter((r) => r.action === 'create').length ?? 0
  const updateCount = preview?.rows.filter((r) => r.action === 'update').length ?? 0
  const errorCount = preview?.rows.filter((r) => r.action === 'error').length ?? 0

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <a
          className="pmc-btn pmc-btn-outline pmc-btn-sm w-fit rounded-full"
          href="/api/admin/bulk-products/template"
        >
          <DownloadIcon className="size-4" />
          Download Sample Template
        </a>
        <a
          className="pmc-btn pmc-btn-outline pmc-btn-sm w-fit rounded-full"
          href="/api/admin/bulk-products/export"
        >
          <DownloadIcon className="size-4" />
          Export Current Products
        </a>
      </div>

      <div className="border-base-content/8 flex flex-col gap-3 rounded-2xl border p-5">
        <label className="text-sm font-medium" htmlFor="bulk-products-file">
          Upload filled-in template (.xlsx)
        </label>
        <input
          accept=".xlsx"
          className="pmc-file-input pmc-file-input-sm w-full max-w-sm"
          id="bulk-products-file"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setPreview(null)
            setCommitResult(null)
            setError(null)
          }}
          type="file"
        />

        <div className="flex items-center gap-3">
          <button
            className="pmc-btn pmc-btn-primary pmc-btn-sm rounded-full"
            disabled={!file || isLoading}
            onClick={() => submit(false)}
            type="button"
          >
            {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
            Preview
          </button>

          {preview && (
            <button
              className="pmc-btn pmc-btn-success pmc-btn-sm rounded-full"
              disabled={isLoading || createCount + updateCount === 0}
              onClick={() => submit(true)}
              type="button"
            >
              Confirm Import ({createCount + updateCount} row{createCount + updateCount === 1 ? '' : 's'})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-error/10 text-error flex items-center gap-2 rounded-xl p-4 text-sm">
          <AlertTriangleIcon className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {preview && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm">
            <StatusPill label={`${createCount} to create`} tone="success" />
            <StatusPill label={`${updateCount} to update`} tone="info" />
            {errorCount > 0 && <StatusPill label={`${errorCount} errors`} tone="error" />}
            {preview.truncated && (
              <span className="text-warning text-xs">Only the first 500 rows were read — split the file for the rest.</span>
            )}
          </div>

          <div className="border-base-content/8 overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-base-content/8 border-b text-left">
                  <th className="px-3 py-2 font-semibold">Row</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                  <th className="px-3 py-2 font-semibold">SKU</th>
                  <th className="px-3 py-2 font-semibold">Title</th>
                  <th className="px-3 py-2 font-semibold">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-base-content/6 divide-y">
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="px-3 py-2">{row.rowNumber}</td>
                    <td className="px-3 py-2">
                      <StatusPill label={row.action} tone={ACTION_TONE[row.action]} />
                    </td>
                    <td className="px-3 py-2">{row.sku || '—'}</td>
                    <td className="px-3 py-2">{row.title || '—'}</td>
                    <td className="text-error px-3 py-2 text-xs">{row.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {commitResult && (
        <div className="border-base-content/8 flex flex-col gap-3 rounded-2xl border p-5">
          <h2 className="text-base font-semibold">Import complete</h2>
          <div className="flex items-center gap-3 text-sm">
            <StatusPill label={`${commitResult.created} created`} tone="success" />
            <StatusPill label={`${commitResult.updated} updated`} tone="info" />
            {commitResult.failed.length > 0 && (
              <StatusPill label={`${commitResult.failed.length} failed`} tone="error" />
            )}
          </div>
          {commitResult.failed.length > 0 && (
            <ul className="text-error flex flex-col gap-1 text-xs">
              {commitResult.failed.map((f) => (
                <li key={f.rowNumber}>
                  Row {f.rowNumber} ({f.title || 'untitled'}): {f.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
