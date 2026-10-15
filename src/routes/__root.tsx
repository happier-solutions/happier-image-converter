/// <reference types="vite/client" />
import React, { type ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import appCss from '../styles/app.css?url'
import { TrongDongBackdrop } from '../components/TrongDongBackdrop'
import { ClickBurstOverlay } from '../components/ClickBurstOverlay'
import { I18nProvider } from '../i18n'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Happier Image — Local SVG, PNG, JPG, WebP & AVIF Optimizer',
      },
      {
        name: 'description',
        content:
          'Convert and optimize SVG, PNG, JPG, WebP, and AVIF locally in your browser with TanStack Start 1.0, jSquash WASM, and SVGO v4.',
      },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', href: '/favicon.svg' },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <I18nProvider>
        <Outlet />
      </I18nProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body className="craft-dot-grid min-h-screen text-stone-900 antialiased relative">
        <TrongDongBackdrop />
        <ClickBurstOverlay />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
        <Scripts />
      </body>
    </html>
  )
}
