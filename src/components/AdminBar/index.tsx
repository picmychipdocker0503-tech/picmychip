'use client'

import type { PayloadAdminBarProps } from '@payloadcms/admin-bar'

import { cn } from '@/utilities/cn'
import { useSelectedLayoutSegments } from 'next/navigation'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React, { useState } from 'react'
import { User } from '@/payload-types'

const collectionLabels = {
  pages: {
    plural: 'Pages',
    singular: 'Page',
  },
  posts: {
    plural: 'Posts',
    singular: 'Post',
  },
  projects: {
    plural: 'Projects',
    singular: 'Project',
  },
}

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
  onVisibilityChange?: (visible: boolean) => void
}> = (props) => {
  const { adminBarProps, onVisibilityChange } = props || {}
  const segments = useSelectedLayoutSegments()
  const [show, setShow] = useState(false)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - todo fix, not sure why this is erroring
  const collection = collectionLabels?.[segments?.[1]] ? segments?.[1] : 'pages'

  const onAuthChange = React.useCallback(
    (user: User) => {
      const canSeeAdmin = user?.roles && Array.isArray(user?.roles) && user?.roles?.includes('admin')

      setShow(Boolean(canSeeAdmin))
      onVisibilityChange?.(Boolean(canSeeAdmin))
    },
    [onVisibilityChange],
  )

  return (
    <div
      className={cn('items-center', {
        flex: show,
        hidden: !show,
      })}
    >
      <PayloadAdminBar
        {...adminBarProps}
        className="text-white"
        classNames={{
          controls: 'font-medium text-white',
          logo: 'font-bold text-purple-300',
          user: 'text-white',
        }}
        cmsURL={process.env.NEXT_PUBLIC_SERVER_URL}
        collectionLabels={{
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - todo fix, not sure why this is erroring
          plural: collectionLabels[collection]?.plural || 'Pages',
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - todo fix, not sure why this is erroring
          singular: collectionLabels[collection]?.singular || 'Page',
        }}
        logo={<Title />}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - todo fix, not sure why this is erroring
        onAuthChange={onAuthChange}
        style={{
          backgroundColor: 'transparent',
          padding: 0,
          position: 'relative',
          zIndex: 'unset',
        }}
      />
    </div>
  )
}
