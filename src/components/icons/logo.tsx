import clsx from 'clsx'
import React from 'react'

export function LogoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      aria-label={`Picmychip logo`}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={clsx('h-4 w-4', props.className)}
    >
      <rect x="3" y="3" width="26" height="26" rx="7" fill="currentColor" />
      <path
        d="M12 23 L12 9 L20 9 L20 16 L12 16"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="23" r="2" fill="white" />
      <circle cx="12" cy="16" r="1.7" fill="white" />
    </svg>
  )
}
