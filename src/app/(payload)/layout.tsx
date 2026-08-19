/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { Inter } from 'next/font/google'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'
// Tailwind + daisyUI entry for custom admin components (BeforeDashboard,
// BeforeLogin, etc.) — see admin-tailwind.css for why this is a separate
// file rather than importing the storefront's globals.css here.
import './admin-tailwind.css'

type Args = {
  children: React.ReactNode
}

// Matches the storefront's font swap (see src/app/(app)/layout.tsx) — a
// thinner, more professional grotesk than the previous GeistSans.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {/* inter.variable exposes --font-geist-sans; .pmc-font-root (see
        custom.scss) resolves it into an actual font-family here, matching
        the storefront's typography. RootLayout owns the real <html>/<body>
        tags so this wrapper is the highest point we can attach it to. */}
    <div className={`${inter.variable} pmc-font-root`}>{children}</div>
  </RootLayout>
)

export default Layout
