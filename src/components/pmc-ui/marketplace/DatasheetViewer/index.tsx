'use client'

import * as React from 'react'
import { FileText, Download, Eye, ChevronDown } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'
import { Button } from '@/components/pmc-ui/primitives/Button'

export interface DatasheetViewerItem {
  title: string
  fileUrl: string
  fileSize?: string
  previewUrl?: string
}

export interface DatasheetViewerProps {
  datasheets: DatasheetViewerItem[]
  className?: string
}

export function DatasheetViewer({ datasheets, className }: DatasheetViewerProps) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null)

  return (
    <ul className={cn('flex flex-col divide-y divide-pmc-slate-200 rounded-lg border border-pmc-slate-200', className)}>
      {datasheets.map((sheet, index) => {
        const expanded = expandedIndex === index
        return (
          <li key={sheet.fileUrl}>
            <div className="flex items-center gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-pmc-blue-50 text-pmc-blue-700">
                <FileText className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-pmc-ink-900">{sheet.title}</p>
                {sheet.fileSize && <p className="text-xs text-pmc-ink-400">{sheet.fileSize}</p>}
              </div>
              {sheet.previewUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-expanded={expanded}
                  onClick={() => setExpandedIndex(expanded ? null : index)}
                  rightIcon={<ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />}
                >
                  Preview
                </Button>
              )}
              <a
                href={sheet.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-9 items-center justify-center rounded-md text-pmc-ink-500 hover:bg-pmc-slate-100 hover:text-pmc-blue-700"
                aria-label={`View ${sheet.title}`}
              >
                <Eye className="size-4" aria-hidden="true" />
              </a>
              <a
                href={sheet.fileUrl}
                download
                className="inline-flex size-9 items-center justify-center rounded-md text-pmc-ink-500 hover:bg-pmc-slate-100 hover:text-pmc-blue-700"
                aria-label={`Download ${sheet.title}`}
              >
                <Download className="size-4" aria-hidden="true" />
              </a>
            </div>
            {expanded && sheet.previewUrl && (
              <iframe
                src={sheet.previewUrl}
                title={sheet.title}
                className="h-96 w-full border-0 border-t border-pmc-slate-200"
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
