'use client'

import { PrinterIcon } from 'lucide-react'
import React from 'react'

export const PrintButton: React.FC = () => {
  return (
    <button
      className="btn btn-primary print:hidden"
      onClick={() => window.print()}
      type="button"
    >
      <PrinterIcon className="size-4" />
      Print / Save as PDF
    </button>
  )
}
