'use client'

import { Media } from '@/components/Media'
import { useAuth } from '@/providers/Auth'
import { getClientSideURL } from '@/utilities/getURL'
import { CameraIcon, LoaderCircleIcon } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { toast } from 'sonner'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export const AccountAvatar: React.FC = () => {
  const { setUser, user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Please choose an image under 5MB.')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('_payload', JSON.stringify({ alt: `${user.name || 'User'} avatar` }))

      const mediaResponse = await fetch(`${getClientSideURL()}/api/media`, {
        body: formData,
        credentials: 'include',
        method: 'POST',
      })

      if (!mediaResponse.ok) throw new Error('Upload failed')

      const mediaJson = await mediaResponse.json()

      const userResponse = await fetch(`${getClientSideURL()}/api/users/${user.id}`, {
        body: JSON.stringify({ avatar: mediaJson.doc.id }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })

      if (!userResponse.ok) throw new Error('Update failed')

      const userJson = await userResponse.json()
      setUser(userJson.doc)
      toast.success('Profile picture updated.')
    } catch {
      toast.error('There was a problem uploading your photo.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-4">
      <div className="group relative size-20 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
        {user.avatar && typeof user.avatar === 'object' ? (
          <Media fill imgClassName="object-cover" resource={user.avatar} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
            {(user.name || user.email || '?').charAt(0).toUpperCase()}
          </div>
        )}

        <button
          aria-label="Change profile picture"
          className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {isUploading ? <LoaderCircleIcon className="size-5 animate-spin" /> : <CameraIcon className="size-5" />}
        </button>
      </div>

      <div>
        <button
          className="btn btn-outline btn-sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {isUploading ? 'Uploading...' : 'Change photo'}
        </button>
        <p className="text-muted-foreground mt-1 text-xs">JPG, PNG, or GIF. Up to 5MB.</p>
      </div>

      <input
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />
    </div>
  )
}
