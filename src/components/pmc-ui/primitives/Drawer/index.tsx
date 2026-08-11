'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'
import { useDialog } from '@/components/pmc-ui/lib/useDialog'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  side?: 'left' | 'right' | 'bottom'
  children?: React.ReactNode
  className?: string
}

const sideStyles: Record<NonNullable<DrawerProps['side']>, string> = {
  left: 'inset-y-0 left-0 h-full w-full max-w-sm',
  right: 'inset-y-0 right-0 h-full w-full max-w-sm',
  bottom: 'inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-xl',
}

const sideInitial: Record<NonNullable<DrawerProps['side']>, { x?: string | number; y?: string | number }> = {
  left: { x: '-100%' },
  right: { x: '100%' },
  bottom: { y: '100%' },
}

export function Drawer({ open, onClose, title, side = 'right', children, className }: DrawerProps) {
  const { containerRef } = useDialog(open, onClose)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
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
            aria-label={title}
            initial={{ opacity: 1, ...sideInitial[side] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={sideInitial[side]}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={cn(
              'absolute flex flex-col bg-white shadow-pmc-lg',
              sideStyles[side],
              className,
            )}
          >
            {title && (
              <div className="flex items-center justify-between gap-4 border-b border-pmc-slate-100 p-4">
                <h2 className="text-base font-semibold text-pmc-ink-900">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-md p-1.5 text-pmc-ink-400 hover:bg-pmc-slate-100 hover:text-pmc-ink-700 focus-visible:outline-none focus-visible:shadow-pmc-focus"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
