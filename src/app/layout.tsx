import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { NavigationProgress } from '@/components/ui/NavigationProgress'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'TileScape — OSRS Clan Bingo & Event Tracker',
  description: 'The modern bingo & event platform built for OSRS clans.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: { url: '/icon-180.png', sizes: '180x180' },
    shortcut: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text antialiased">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
