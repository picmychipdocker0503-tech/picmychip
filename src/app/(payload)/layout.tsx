/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { GeistSans } from 'geist/font/sans'
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
    {/* GeistSans.variable exposes --font-geist-sans; .pmc-font-root (see
        custom.scss) resolves it into an actual font-family here, matching
        the storefront's typography. RootLayout owns the real <html>/<body>
        tags so this wrapper is the highest point we can attach it to. */}
    <div className={`${GeistSans.variable} pmc-font-root`}>{children}</div>
  </RootLayout>
)

export default Layout
