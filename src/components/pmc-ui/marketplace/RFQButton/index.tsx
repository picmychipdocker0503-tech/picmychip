'use client'

import { FileSignature } from 'lucide-react'
import * as React from 'react'

import { Button, type ButtonProps } from '@/components/pmc-ui/primitives/Button'
import { Input } from '@/components/pmc-ui/primitives/Input'
import { Modal } from '@/components/pmc-ui/primitives/Modal'

export interface RFQButtonProps {
  partNumber?: string
  productTitle?: string
  recipientEmail?: string
  buttonLabel?: string
  buttonSize?: ButtonProps['size']
  className?: string
}

export function RFQButton({
  partNumber,
  productTitle,
  recipientEmail = 'sales@Picmychip.com',
  buttonLabel = 'Request a quote',
  buttonSize = 'md',
  className,
}: RFQButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [quantity, setQuantity] = React.useState('')
  const [notes, setNotes] = React.useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const subject = encodeURIComponent(`RFQ${productTitle ? `: ${productTitle}` : ''}${partNumber ? ` (${partNumber})` : ''}`)
    const bodyLines = [
      productTitle && `Product: ${productTitle}`,
      partNumber && `Part number: ${partNumber}`,
      quantity && `Quantity: ${quantity}`,
      notes && `Notes: ${notes}`,
    ].filter(Boolean)
    const body = encodeURIComponent(bodyLines.join('\n'))
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="primary"
        size={buttonSize}
        className={className}
        leftIcon={<FileSignature className="size-4" />}
        onClick={() => setOpen(true)}
      >
        {buttonLabel}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request a quote"
        description={productTitle ? `For ${productTitle}${partNumber ? ` (${partNumber})` : ''}` : undefined}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {partNumber && (
            <Input label="Part number" value={partNumber} readOnly />
          )}
          <Input
            label="Quantity"
            type="number"
            min={1}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-pmc-ink-800">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-md border border-pmc-slate-300 bg-white p-3 text-sm text-pmc-ink-900 placeholder:text-pmc-ink-400 focus-visible:outline-none focus-visible:shadow-pmc-focus focus-visible:border-pmc-blue-600"
              placeholder="Target lead time, delivery location, alternates accepted…"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Send request</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
