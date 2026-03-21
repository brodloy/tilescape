'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TileGrid } from './TileGrid'
import { TeamStandings } from './TeamStandings'

interface Props {
  initialTiles: any[]
  teams: any[]
  userTeamId: string | null
  eventId: string
  canSubmit: boolean
}

export function RealtimeBoard({ initialTiles, teams, userTeamId, eventId, canSubmit }: Props) {
  const [tiles, setTiles] = useState(initialTiles)
  const [connected, setConnected] = useState(false)
  const supabase = createClient()

  const refreshTiles = useCallback(async () => {
    const db = supabase as any
    const { data } = await db
      .from('tiles')
      .select('*, tile_completions(id, status, proof_url, submitted_at, team_id, users!submitted_by(display_name))')
      .eq('event_id', eventId)
      .order('position')

    if (data) setTiles(data)
  }, [eventId, supabase])

  useEffect(() => {
    // Subscribe to tile_completions changes for this event's tiles
    const channel = supabase
      .channel(`event-board-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tile_completions',
        },
        (payload) => {
          // Refresh tiles when any completion changes
          refreshTiles()
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, supabase, refreshTiles])

  return (
    <>
      {/* Live indicator */}
      {connected && (
        <div className="px-5 pb-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_4px_#3ecf74] animate-pulse" />
            <span className="font-pixel text-[6px] text-text-3 tracking-wider">LIVE UPDATES ON</span>
          </div>
        </div>
      )}

      <TileGrid
        tiles={tiles}
        teams={teams}
        userTeamId={userTeamId}
        eventId={eventId}
        canSubmit={canSubmit}
      />

      <div className="px-5 pb-8">
        <TeamStandings teams={teams} tiles={tiles} />
      </div>
    </>
  )
}
