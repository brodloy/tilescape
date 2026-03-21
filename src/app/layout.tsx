import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TileScape — OSRS Clan Bingo & Event Tracker',
  description: 'The modern bingo & event platform built for OSRS clans.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text antialiased">
        {children}
      </body>
    </html>
  )
}
