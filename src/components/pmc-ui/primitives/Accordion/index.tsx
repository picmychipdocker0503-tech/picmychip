'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface AccordionItemData {
  id: string
  title: string
  content: React.ReactNode
}

export interface AccordionProps {
  items: AccordionItemData[]
  type?: 'single' | 'multiple'
  defaultOpen?: string[]
  className?: string
}

export function Accordion({ items, type = 'single', defaultOpen = [], className }: AccordionProps) {
  const [openIds, setOpenIds] = React.useState<string[]>(defaultOpen)

  function toggle(id: string) {
    setOpenIds((prev) => {
      const isOpen = prev.includes(id)
      if (type === 'single') return isOpen ? [] : [id]
      return isOpen ? prev.filter((v) => v !== id) : [...prev, id]
    })
  }

  return (
    <div className={cn('divide-y divide-pmc-slate-200 rounded-lg border border-pmc-slate-200', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id)
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`pmc-accordion-panel-${item.id}`}
                id={`pmc-accordion-trigger-${item.id}`}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium text-pmc-ink-900 hover:bg-pmc-slate-50 focus-visible:outline-none focus-visible:shadow-pmc-focus"
              >
                {item.title}
                <ChevronDown
                  className={cn('size-4 shrink-0 text-pmc-ink-400 transition-transform', isOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`pmc-accordion-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`pmc-accordion-trigger-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-sm text-pmc-ink-600">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
