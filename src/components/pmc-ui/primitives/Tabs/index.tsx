'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  className?: string
}

export function Tabs({ tabs, value, defaultValue, onValueChange, className }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? tabs[0]?.id)
  const activeId = value ?? internalValue
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const layoutId = React.useId()

  function selectTab(id: string) {
    setInternalValue(id)
    onValueChange?.(id)
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const enabled = tabs.filter((t) => !t.disabled)
    if (enabled.length === 0) return
    let nextIndex = index

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = tabs.length - 1
    else return

    event.preventDefault()
    const next = tabs[nextIndex]
    if (next.disabled) return
    selectTab(next.id)
    tabRefs.current[next.id]?.focus()
  }

  const activeTab = tabs.find((t) => t.id === activeId)

  return (
    <div className={className}>
      <div role="tablist" aria-label="Tabs" className="flex gap-1 border-b border-pmc-slate-200">
        {tabs.map((tab, index) => {
          const selected = tab.id === activeId
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el
              }}
              role="tab"
              id={`pmc-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`pmc-tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-pmc-focus',
                selected ? 'text-pmc-blue-700' : 'text-pmc-ink-500 hover:text-pmc-ink-800',
                tab.disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              {tab.label}
              {selected && (
                <motion.span
                  layoutId={`pmc-tabs-indicator-${layoutId}`}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-pmc-blue-600"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          )
        })}
      </div>
      {activeTab && (
        <div
          role="tabpanel"
          id={`pmc-tabpanel-${activeTab.id}`}
          aria-labelledby={`pmc-tab-${activeTab.id}`}
          tabIndex={0}
          className="pt-4 focus-visible:outline-none"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  )
}
