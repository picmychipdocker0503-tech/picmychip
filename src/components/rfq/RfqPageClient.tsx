'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { RfqForm } from './RfqForm'
import { RfqHero } from './RfqHero'

const ACCEPTED_EXTENSIONS = '.xlsx,.xls,.csv'

export const RfqPageClient: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleManualEntryClick = useCallback(() => {
    document.getElementById('rfq-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    if (selected) {
      document.getElementById('rfq-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // Allow re-selecting the same file after removing it.
    event.target.value = ''
  }, [])

  const handleRemoveFile = useCallback(() => setFile(null), [])

  // Header "BOM" quick-access link (/rfq?upload=1) — best-effort: most
  // browsers allow a plain <input type="file"> click() from an effect right
  // after navigation, but if one blocks it (no trusted user gesture), the
  // visible "Upload BOM" button in the hero still works as a fallback.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('upload') === '1') {
      fileInputRef.current?.click()
    }
  }, [])

  return (
    <>
      <input
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />
      <RfqHero onManualEntryClick={handleManualEntryClick} onUploadClick={handleUploadClick} />
      <RfqForm file={file} onRemoveFile={handleRemoveFile} />
    </>
  )
}
