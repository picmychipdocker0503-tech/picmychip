'use client'

import { DownloadIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'pwa-install-dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === '1')

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setDeferredPrompt(null)
      window.localStorage.setItem(DISMISSED_KEY, '1')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  if (!deferredPrompt || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    window.localStorage.setItem(DISMISSED_KEY, '1')
  }

  const install = async () => {
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <div className="border-border bg-card fixed inset-x-4 bottom-[calc(4rem+1rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border p-4 shadow-lg sm:right-4 sm:left-auto md:bottom-4">
      <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
        <DownloadIcon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm font-semibold">Install Picmychip</p>
        <p className="text-muted-foreground text-xs">Quick access from your home screen.</p>
      </div>

      <button
        aria-label="Install app"
        className="btn btn-primary btn-sm shrink-0"
        onClick={install}
        type="button"
      >
        Install
      </button>

      <button
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground shrink-0"
        onClick={dismiss}
        type="button"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  )
}
