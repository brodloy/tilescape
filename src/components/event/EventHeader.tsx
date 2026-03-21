'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/ui/Badge'

interface Props {
  event: { id: string; name: string; status: string; invite_code: string }
  membership: { role: string }
  userId: string
  pendingCount: number
}

export function EventHeader({ event, membership, userId, pendingCount }: Props) {
  return (
    <header className="h-12 bg-bg2 border-b border-[rgba(232,184,75,0.20)] flex items-center justify-between px-4 flex-shrink-0 z-50">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-syne font-extrabold text-base tracking-tight">
          Tile<span className="text-gold">Scape</span>
        </Link>
        <span className="text-text-3 text-xs">/</span>
        <span className="font-syne font-bold text-sm text-text-2 max-w-[200px] truncate">{event.name}</span>
        <StatusBadge status={event.status as any} />
      </div>

      <div className="flex items-center gap-2">
        {pendingCount > 0 && (
          <Link href={`/events/${event.id}/submissions`}>
            <span className="flex items-center gap-1.5 font-pixel text-[6px] bg-[rgba(232,184,75,0.1)] border border-[rgba(232,184,75,0.2)] text-gold px-2.5 py-1.5 rounded hover:bg-[rgba(232,184,75,0.15)] transition-colors">
              {pendingCount} PENDING
            </span>
          </Link>
        )}
        <span className="font-pixel text-[6px] text-text-3 border border-[rgba(232,184,75,0.12)] px-2.5 py-1.5 rounded bg-surface">
          {event.invite_code}
        </span>
        <Link href="/dashboard" className="text-xs text-text-2 hover:text-text transition-colors">
          Dashboard
        </Link>
      </div>
    </header>
  )
}
