'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'
import { useDialog } from '@/components/pmc-ui/lib/useDialog'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  const { containerRef } = useDialog(open, onClose)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-pmc-ink-900/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pmc-modal-title"
            aria-describedby={description ? 'pmc-modal-description' : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'relative z-10 w-full max-w-lg rounded-lg border border-pmc-slate-200 bg-white shadow-pmc-lg',
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-pmc-slate-100 p-5">
              <div>
                <h2 id="pmc-modal-title" className="text-lg font-semibold text-pmc-ink-900">
                  {title}
                </h2>
                {description && (
                  <p id="pmc-modal-description" className="mt-1 text-sm text-pmc-ink-500">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-md p-1.5 text-pmc-ink-400 hover:bg-pmc-slate-100 hover:text-pmc-ink-700 focus-visible:outline-none focus-visible:shadow-pmc-focus"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
