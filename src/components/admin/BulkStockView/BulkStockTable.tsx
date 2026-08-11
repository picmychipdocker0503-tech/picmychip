'use client'

import type { Product } from '@/payload-types'

import { toast } from '@payloadcms/ui'
import React, { useMemo, useState } from 'react'

type Row = Pick<Product, 'id' | 'title' | 'slug' | 'priceInINR' | 'inventory' | 'lowStockThreshold' | 'stockStatus'>

type Edits = Record<number, Partial<Pick<Row, 'priceInINR' | 'inventory' | 'lowStockThreshold'>>>

const STOCK_BADGE: Record<string, string> = {
  'in-stock': 'pmc-badge-success',
  'low-stock': 'pmc-badge-warning',
  'out-of-stock': 'pmc-badge-error',
  backorder: 'pmc-badge-warning',
}

export const BulkStockTable: React.FC<{ products: Row[] }> = ({ products }) => {
  const [query, setQuery] = useState('')
  const [edits, setEdits] = useState<Edits>({})
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(
    () => products.filter((product) => (product.title ?? '').toLowerCase().includes(query.toLowerCase())),
    [products, query],
  )

  const dirtyCount = Object.keys(edits).length

  const updateField = (id: number, field: keyof Edits[number], value: number) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const saveAll = async () => {
    setSaving(true)
    const entries = Object.entries(edits)
    let succeeded = 0

    for (const [id, changes] of entries) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          body: JSON.stringify(changes),
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        })
        if (response.ok) succeeded += 1
      } catch {
        // counted via succeeded < entries.length below
      }
    }

    setSaving(false)

    if (succeeded === entries.length) {
      toast.success(`Saved ${succeeded} product${succeeded === 1 ? '' : 's'}.`)
      setEdits({})
    } else {
      toast.error(`Saved ${succeeded} of ${entries.length} — some updates failed, please retry.`)
    }
  }

  return (
    <div className="border-base-content/10 bg-base-100/40 pmc-rounded-box flex flex-col gap-4 border p-5 shadow-md backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="pmc-input pmc-input-sm w-full max-w-xs"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product title…"
          type="text"
          value={query}
        />
        <div className="text-base-content/60 flex items-center gap-3 text-sm">
          <span>
            {filtered.length} product{filtered.length === 1 ? '' : 's'}
          </span>
          <button
            className="pmc-btn pmc-btn-primary pmc-btn-sm"
            disabled={dirtyCount === 0 || saving}
            onClick={saveAll}
            type="button"
          >
            {saving && <span className="pmc-loading pmc-loading-spinner pmc-loading-xs" />}
            {saving ? 'Saving…' : `Save Changes${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
          </button>
        </div>
      </div>

      <div className="border-base-content/10 pmc-rounded-box overflow-x-auto border">
        <table className="pmc-table pmc-table-zebra">
          <thead>
            <tr className="text-base-content/70">
              <th>Title</th>
              <th>Slug</th>
              <th>Price (INR)</th>
              <th>Inventory</th>
              <th>Low Stock Threshold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const edit = edits[product.id]
              const badgeClass = STOCK_BADGE[product.stockStatus ?? ''] ?? 'pmc-badge-ghost'

              return (
                <tr className={edit ? 'bg-warning/10' : undefined} key={product.id}>
                  <td>
                    <a className="pmc-link pmc-link-hover" href={`/admin/collections/products/${product.id}`}>
                      {product.title}
                    </a>
                  </td>
                  <td className="text-base-content/60 font-mono text-xs">{product.slug}</td>
                  <td>
                    <input
                      className="pmc-input pmc-input-sm w-24"
                      onChange={(e) => updateField(product.id, 'priceInINR', Number(e.target.value))}
                      type="number"
                      value={edit?.priceInINR ?? product.priceInINR ?? 0}
                    />
                  </td>
                  <td>
                    <input
                      className="pmc-input pmc-input-sm w-20"
                      onChange={(e) => updateField(product.id, 'inventory', Number(e.target.value))}
                      type="number"
                      value={edit?.inventory ?? product.inventory ?? 0}
                    />
                  </td>
                  <td>
                    <input
                      className="pmc-input pmc-input-sm w-20"
                      onChange={(e) => updateField(product.id, 'lowStockThreshold', Number(e.target.value))}
                      type="number"
                      value={edit?.lowStockThreshold ?? product.lowStockThreshold ?? 5}
                    />
                  </td>
                  <td>
                    <span className={`pmc-badge ${badgeClass} pmc-badge-sm whitespace-nowrap`}>{product.stockStatus}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <p className="text-base-content/60 text-sm">No products match &quot;{query}&quot;.</p>}
    </div>
  )
}
