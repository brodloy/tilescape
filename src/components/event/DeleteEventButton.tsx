'use client'

import { useTransition } from 'react'
import { deleteEventVoid } from '@/app/actions/deleteEvent'

export function DeleteEventButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`Delete "${eventName}"? This cannot be undone. All tiles, teams and submissions will be permanently removed.`)) return
    startTransition(async () => {
      await deleteEventVoid(eventId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="font-pixel text-[6px] px-4 py-2.5 rounded bg-[rgba(232,85,85,0.08)] border border-[rgba(232,85,85,0.25)] text-red hover:bg-[rgba(232,85,85,0.18)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'DELETING…' : 'DELETE EVENT PERMANENTLY'}
    </button>
  )
}
