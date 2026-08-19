'use client'

import React, { useCallback, useRef, useState } from 'react'
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
