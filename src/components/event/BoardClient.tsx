'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AppNav } from '@/components/ui/AppNav'
import { submitCompletion, reviewCompletion, quickCompleteTile, uncompleteTeamTile } from '@/app/actions/completions'
import { goLive, endEvent } from '@/app/actions/forms'
import { useRouter } from 'next/navigation'
import { ToastArea, BingoCelebration, showToast } from '@/components/event/Celebrations'

const WIKI = 'https://oldschool.runescape.wiki/w/Special:FilePath/'
const W = (n: string) => WIKI + encodeURIComponent(n.replace(/ /g, '_')) + '.png'

const RAID_COLORS: Record<string, string> = {
  CoX: '#e8b84b', ToB: '#e85555', ToA: '#a875f0',
  Nex: '#4b9ef0', NM: '#3ecf74', DT2: '#e8824b',
  Inferno: '#ff7755', Liz: '#88dd66', GWD: '#f0c85a', Slayer: '#4bd4e8',
}

// DEV MODE: set to false to require proof URLs
const DEV_QUICK_COMPLETE = true

interface Props {
  event: any; initialTiles: any[]; teams: any[]; members: any[]
  pendingSubmissions: any[]; userTeamId: string | null
  isOwnerOrMod: boolean; isOwner: boolean
  displayName: string; eventId: string
}

function calcBingos(tiles: any[], teamId: string) {
  const lines: number[][] = []
  for (let r = 0; r < 5; r++) lines.push([r*5,r*5+1,r*5+2,r*5+3,r*5+4])
  for (let c = 0; c < 5; c++) lines.push([c,c+5,c+10,c+15,c+20])
  lines.push([0,6,12,18,24]); lines.push([4,8,12,16,20])
  const sorted = [...tiles].sort((a,b) => a.position - b.position)
  const check = (i: number) => {
    const t = sorted[i]; if (!t) return false
    if (t.free_space) return true
    return t.tile_completions?.some((c: any) => c.team_id === teamId && c.status === 'approved') ?? false
  }
  return lines.filter(l => l.every(check)).length
}

export function BoardClient({ event, initialTiles, teams, members, pendingSubmissions, userTeamId, isOwnerOrMod, isOwner, displayName, eventId }: Props) {
  const [tiles, setTiles] = useState(initialTiles)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [selectedTile, setSelectedTile] = useState<any | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [connected, setConnected] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [bingoCelebration, setBingoCelebration] = useState<{ teamName: string; teamColor: string; count: number } | null>(null)
  const [completingTileId, setCompletingTileId] = useState<string | null>(null)
  const prevBingosRef = useRef<Record<string, number>>({})
  const router = useRouter()
  const supabase = createClient()

  const refreshTiles = useCallback(async () => {
    const db = supabase as any
    const { data } = await db.from('tiles')
      .select('*, tile_completions(id, status, proof_url, submitted_at, team_id, users!submitted_by(display_name))')
      .eq('event_id', eventId).order('position')
    if (data) setTiles(data)
  }, [eventId, supabase])

  useEffect(() => {
    const channel = supabase.channel(`board-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tile_completions' }, () => refreshTiles())
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(channel) }
  }, [eventId, supabase, refreshTiles])

  // Check for new bingos after tiles update
  useEffect(() => {
    if (!userTeamId) return
    const userTeam = teams.find(t => t.id === userTeamId)
    if (!userTeam) return
    const newBingos = calcBingos(tiles, userTeamId)
    const prev = prevBingosRef.current[userTeamId] ?? 0
    if (newBingos > prev && prev >= 0) {
      setBingoCelebration({ teamName: userTeam.name, teamColor: userTeam.color, count: newBingos })
    }
    prevBingosRef.current[userTeamId] = newBingos
  }, [tiles, userTeamId, teams])

  async function handleQuickComplete(tile: any) {
    if (!userTeamId || !tile || tile.free_space) return

    // Always read current state from the live tiles array, not the stale modal tile
    const liveTile = tiles.find(t => t.id === tile.id) ?? tile
    const state = getTileState(liveTile, userTeamId)

    if (state === 'approved') {
      setCompletingTileId(tile.id)
      await uncompleteTeamTile(tile.id, userTeamId)
      await refreshTiles()
      setCompletingTileId(null)
      showToast({ type: 'undo', title: 'Tile uncompleted', subtitle: tile.name })
      return
    }

    setCompletingTileId(tile.id)
    const result = await quickCompleteTile(tile.id, userTeamId)
    await refreshTiles()
    setCompletingTileId(null)
    setSelectedTile(null)

    if (result?.error) {
      showToast({ type: 'error', title: 'Error', subtitle: result.error })
    } else {
      showToast({
        type: tile.is_purple ? 'purple' : 'complete',
        title: tile.is_purple ? '⬥ Purple Drop!' : 'Tile Completed!',
        subtitle: tile.name,
      })
    }
  }

  const nonFree = tiles.filter(t => !t.free_space)
  const totalApproved = nonFree.filter(t => t.tile_completions?.some((c: any) => c.status === 'approved')).length

  function getTileState(tile: any, teamId: string | null): 'free'|'approved'|'pending'|'none' {
    if (tile.free_space) return 'free'
    if (!teamId) return 'none'
    const c = tile.tile_completions?.find((c: any) => c.team_id === teamId)
    if (!c) return 'none'
    return c.status
  }

  function getApprovedTeams(tile: any) {
    return teams.filter(t => tile.tile_completions?.some((c: any) => c.team_id === t.id && c.status === 'approved'))
  }

  async function handleSubmit() {
    if (!selectedTile || !userTeamId || !proofUrl.trim()) return
    setSubmitting(true); setSubmitError('')
    const result = await submitCompletion(selectedTile.id, userTeamId, proofUrl)
    setSubmitting(false)
    if (result?.error) { setSubmitError(result.error); return }
    setSelectedTile(null); setProofUrl('')
    refreshTiles()
  }

  async function handleReview(submissionId: string, action: 'approve'|'reject') {
    setReviewingId(submissionId)
    await reviewCompletion(submissionId, action === 'approve' ? 'approved' : 'rejected')
    setReviewingId(null)
    refreshTiles()
    router.refresh()
  }

  async function handleGoLive() {
    setPending(true); await goLive(eventId); setPending(false); router.refresh()
  }

  async function handleEnd() {
    if (!confirm('End this event?')) return
    setPending(true); await endEvent(eventId); setPending(false); router.refresh()
  }

  const displayTeamId = selectedTeamId ?? userTeamId

  // Nav context
  const navContext = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>{event.name}</span>
      {event.status === 'live' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Press Start 2P',monospace", fontSize: '6px', padding: '3px 8px', borderRadius: '3px', background: 'rgba(62,207,116,0.12)', color: '#3ecf74', border: '1px solid rgba(62,207,116,0.2)' }}>
          <div style={{ width: '5px', height: '5px', background: '#3ecf74', borderRadius: '50%', animation: 'livepulse 1.5s infinite' }} />
          LIVE
          <style>{`@keyframes livepulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(62,207,116,0.5)}50%{opacity:.6;box-shadow:0 0 0 4px rgba(62,207,116,0)}}`}</style>
        </div>
      )}
      {event.status === 'draft' && (
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', padding: '3px 8px', borderRadius: '3px', background: 'rgba(154,143,122,0.08)', color: '#9a8f7a', border: '1px solid rgba(154,143,122,0.15)' }}>DRAFT</div>
      )}
      {connected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '5px', height: '5px', background: '#3ecf74', borderRadius: '50%', boxShadow: '0 0 4px #3ecf74' }} />
          <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5px', color: '#4a4438' }}>LIVE UPDATES</span>
        </div>
      )}
    </div>
  )

  const navActions = (
    <div style={{ display: 'flex', gap: '8px' }}>
      {isOwner && event.status === 'draft' && (
        <button onClick={handleGoLive} disabled={pending} style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '13px', padding: '7px 16px', borderRadius: '8px', background: '#e8b84b', color: '#0c0a08', border: 'none', cursor: 'pointer', boxShadow: '0 0 16px rgba(232,184,75,0.2)' }}>
          🟢 Go Live
        </button>
      )}
      {isOwner && event.status === 'live' && (
        <button onClick={handleEnd} disabled={pending} style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '13px', padding: '7px 16px', borderRadius: '8px', background: 'none', border: '1px solid rgba(232,184,75,0.2)', color: '#9a8f7a', cursor: 'pointer' }}>
          End Event
        </button>
      )}
      {isOwnerOrMod && (
        <Link href={`/events/${eventId}/manage`} style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '13px', padding: '7px 16px', borderRadius: '8px', background: 'none', border: '1px solid rgba(232,184,75,0.2)', color: '#9a8f7a', textDecoration: 'none' }}>
          Manage
        </Link>
      )}
    </div>
  )

  return (
    <>
    <style>{`html, body { height: 100%; overflow: hidden; margin: 0; padding: 0; }`}</style>
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)', fontFamily: "'DM Sans',sans-serif" }}>
      <AppNav displayName={displayName} context={navContext} actions={navActions} />

      {/* Three-column layout below nav */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 260px', marginTop: '64px', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{ background: 'var(--bg2)', borderRight: '1px solid rgba(232,184,75,0.10)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Invite code */}
          <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(232,184,75,0.08)' }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', letterSpacing: '1.5px', marginBottom: '6px' }}>INVITE CODE</div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '13px', color: '#e8b84b', letterSpacing: '3px' }}>{event.invite_code}</div>
          </div>

          {/* Teams filter */}
          <div style={{ padding: '14px 12px 6px', flex: 1 }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', letterSpacing: '2px', padding: '0 4px', marginBottom: '10px' }}>TEAMS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* All teams option */}
              <button onClick={() => setSelectedTeamId(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${selectedTeamId === null ? 'rgba(232,184,75,0.25)' : 'transparent'}`, background: selectedTeamId === null ? 'var(--surface)' : 'none', textAlign: 'left', transition: 'all .15s' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'linear-gradient(135deg, #e8824b, #4b9ef0, #3ecf74)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '12px', color: 'var(--text)', marginBottom: '2px' }}>All Teams</div>
                  <div style={{ height: '2px', background: 'var(--bg3)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round(totalApproved / Math.max(nonFree.length, 1) * 100)}%`, background: 'linear-gradient(90deg, #e8824b, #4b9ef0)', transition: 'width .5s' }} />
                  </div>
                </div>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#9a8f7a' }}>{totalApproved}</span>
              </button>

              {teams.map(team => {
                const done = nonFree.filter(t => t.tile_completions?.some((c: any) => c.team_id === team.id && c.status === 'approved')).length
                const pct = Math.round(done / Math.max(nonFree.length, 1) * 100)
                const isSelected = selectedTeamId === team.id
                const isMyTeam = team.id === userTeamId
                return (
                  <button key={team.id} onClick={() => setSelectedTeamId(isSelected ? null : team.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${isSelected ? `${team.color}44` : 'transparent'}`, background: isSelected ? `${team.color}10` : 'none', textAlign: 'left', transition: 'all .15s', position: 'relative' }}>
                    {isSelected && <div style={{ position: 'absolute', left: 0, top: '6px', bottom: '6px', width: '3px', borderRadius: '0 2px 2px 0', background: team.color }} />}
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: team.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '12px', color: 'var(--text)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {team.name}
                        {isMyTeam && <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5px', color: team.color }}>YOU</span>}
                      </div>
                      <div style={{ height: '2px', background: 'var(--bg3)', borderRadius: '1px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: team.color, transition: 'width .5s' }} />
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: team.color }}>{done}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding: '14px', borderTop: '1px solid rgba(232,184,75,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { label: 'DONE', value: totalApproved, color: '#e8b84b' },
                { label: 'PCT', value: `${Math.round(totalApproved/Math.max(nonFree.length,1)*100)}%`, color: '#3ecf74' },
                { label: 'PURPLES', value: tiles.filter(t => !t.free_space && t.is_purple && t.tile_completions?.some((c:any) => c.status==='approved')).length, color: '#a875f0' },
                { label: 'TEAMS', value: teams.length, color: '#4b9ef0' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.08)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '20px', color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5.5px', color: '#4a4438', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main board ── */}
        <main style={{ overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', backgroundImage: 'linear-gradient(rgba(232,184,75,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(232,184,75,0.018) 1px,transparent 1px)', backgroundSize: '48px 48px' }}>
          <div style={{ padding: '20px 24px', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px', color: 'var(--text)', marginBottom: '3px' }}>
              {displayTeamId ? teams.find(t => t.id === displayTeamId)?.name ?? 'All Teams' : 'All Teams'}
            </div>
            <div style={{ fontSize: '13px', color: '#9a8f7a' }}>{totalApproved} of {nonFree.length} tiles completed</div>
          </div>

          {/* Board grid */}
          <div style={{ padding: '0 24px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '7px', maxWidth: '820px' }}>
              {[...tiles].sort((a,b) => a.position - b.position).map(tile => {
                const state = getTileState(tile, displayTeamId)
                const approvedTeams = getApprovedTeams(tile)
                const pendingTeams = teams.filter(t => tile.tile_completions?.some((c:any) => c.team_id === t.id && c.status === 'pending'))
                const isTeamMode = !!displayTeamId

                let bg = 'var(--surface)'
                let border = 'rgba(255,255,255,0.06)'
                if (tile.free_space) { bg = 'rgba(232,184,75,0.06)'; border = 'rgba(232,184,75,0.2)' }
                else if (isTeamMode && state === 'approved') { bg = 'rgba(62,207,116,0.12)'; border = 'rgba(62,207,116,0.55)' }
                else if (isTeamMode && state === 'pending') { bg = 'rgba(232,184,75,0.08)'; border = 'rgba(232,184,75,0.3)' }
                else if (isTeamMode && state === 'none') { bg = '#0e0c09'; border = 'rgba(255,255,255,0.04)' }
                else if (!isTeamMode && approvedTeams.length > 0) { bg = 'var(--surface)' }
                else if (tile.is_purple) { bg = 'rgba(168,117,240,0.06)'; border = 'rgba(168,117,240,0.2)' }
                else { bg = 'var(--bg3)'; border = 'rgba(255,255,255,0.04)' }

                const imgFilter = isTeamMode && state === 'none' ? 'grayscale(1) brightness(0.35)' : isTeamMode && state === 'approved' ? 'drop-shadow(0 0 8px rgba(62,207,116,0.4)) brightness(1.1)' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))'

                return (
                  <button key={tile.id}
                    onClick={() => { if (tile.free_space) return; setSelectedTile(tile) }}
                    style={{ aspectRatio: '1', background: bg, border: `1px solid ${border}`, borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: tile.free_space ? 'default' : 'pointer', position: 'relative', overflow: 'hidden', padding: '8px 4px 6px', transition: 'all .2s',
                      boxShadow: isTeamMode && state === 'approved' ? '0 0 16px rgba(62,207,116,0.08)' : 'none',
                      transform: completingTileId === tile.id ? 'scale(1.08)' : 'scale(1)',
                    }}>

                    {/* Top colour bar — all teams view */}
                    {!isTeamMode && approvedTeams.length > 0 && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', display: 'flex' }}>
                        {approvedTeams.map(t => <div key={t.id} style={{ flex: 1, background: t.color }} />)}
                      </div>
                    )}

                    {/* Purple pip */}
                    {tile.is_purple && (
                      <div style={{ position: 'absolute', top: '5px', left: '5px', width: '6px', height: '6px', background: '#a875f0', borderRadius: '1px', boxShadow: '0 0 5px #a875f0' }} />
                    )}

                    {/* Approved — clean full bottom sweep */}
                    {isTeamMode && state === 'approved' && (
                      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                        {/* Subtle green tint overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(62,207,116,0.07)', borderRadius: '9px' }} />
                        {/* Bottom bar */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #3ecf74, #5ee890)', borderRadius: '0 0 9px 9px' }} />
                        {/* Tick — top right, clean circle */}
                        <div style={{ position: 'absolute', top: '5px', right: '5px', width: '16px', height: '16px', borderRadius: '50%', background: '#3ecf74', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(62,207,116,0.6)' }}>
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.5 6L8 1" stroke="#041a0c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Pending — subtle gold bottom bar */}
                    {isTeamMode && state === 'pending' && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#e8b84b', borderRadius: '0 0 9px 9px', opacity: 0.7 }} />
                    )}

                    {/* Sprite */}
                    {tile.free_space ? (
                      <span style={{ fontSize: '22px' }}>⭐</span>
                    ) : (
                      <img src={tile.sprite_url || W(tile.name)} alt={tile.name} style={{ width: '55%', height: '55%', objectFit: 'contain', imageRendering: 'pixelated', filter: imgFilter, transition: 'filter .2s' }} onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1' }} />
                    )}

                    {/* Name */}
                    <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5px', textAlign: 'center', color: tile.free_space ? '#e8b84b' : isTeamMode && state === 'approved' ? '#88ffbb' : isTeamMode && state === 'none' ? '#2a2520' : '#4a4438', padding: '0 2px', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color .2s' }}>
                      {tile.free_space ? 'FREE' : tile.name}
                    </div>

                    {/* Pending dots (all-teams view) */}
                    {!isTeamMode && pendingTeams.length > 0 && (
                      <div style={{ position: 'absolute', bottom: '3px', left: '3px', display: 'flex', gap: '2px' }}>
                        {pendingTeams.map(t => <div key={t.id} style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.color, border: '1px solid var(--bg)' }} />)}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Team standings */}
            {teams.length > 1 && (
              <div style={{ maxWidth: '820px', marginTop: '20px', marginBottom: '32px', background: 'var(--bg2)', border: '1px solid rgba(232,184,75,0.10)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(232,184,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#e8b84b', letterSpacing: '1.5px' }}>⚔ TEAM STANDINGS</span>
                </div>
                {[...teams].map(t => ({ ...t, done: nonFree.filter(tile => tile.tile_completions?.some((c:any) => c.team_id === t.id && c.status==='approved')).length, bingos: calcBingos(tiles, t.id), pct: Math.round(nonFree.filter(tile => tile.tile_completions?.some((c:any) => c.team_id===t.id && c.status==='approved')).length / Math.max(nonFree.length,1) * 100) }))
                  .sort((a,b) => b.done - a.done || b.bingos - a.bingos)
                  .map((team, rank) => (
                    <div key={team.id} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid rgba(232,184,75,0.06)', position: 'relative', cursor: 'pointer', transition: 'background .15s' }}
                      onClick={() => setSelectedTeamId(selectedTeamId === team.id ? null : team.id)}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: rank===0?'#ffd700':rank===1?'#c0c0c0':'#cd7f32', opacity: 0.7 }} />
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: rank===0?'rgba(255,215,0,0.12)':rank===1?'rgba(192,192,192,0.08)':'rgba(205,127,50,0.08)', border: `1px solid ${rank===0?'rgba(255,215,0,0.3)':rank===1?'rgba(192,192,192,0.2)':'rgba(205,127,50,0.2)'}` }}>
                        {['🥇','🥈','🥉'][rank] ?? rank+1}
                      </div>
                      <div style={{ padding: '0 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: team.color }} />
                          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '14px', color: 'var(--text)' }}>{team.name}</span>
                        </div>
                        <div style={{ height: '10px', background: 'var(--bg3)', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ height: '100%', borderRadius: '4px', width: `${team.pct}%`, background: team.color, transition: 'width 1s cubic-bezier(.34,1.2,.64,1)', position: 'relative', minWidth: team.pct>0?'6px':'0' }}>
                            <div style={{ position: 'absolute', top: '1px', left: '2px', right: '2px', height: '40%', background: 'rgba(255,255,255,0.2)', borderRadius: '3px 3px 0 0' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', minWidth: '80px' }}>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '22px', letterSpacing: '-1px', color: team.color }}>{team.pct}%</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5.5px', padding: '2px 6px', borderRadius: '3px', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.06)', color: '#4a4438' }}>{team.done}/{nonFree.length}</span>
                          {team.bingos > 0 && <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5.5px', padding: '2px 6px', borderRadius: '3px', background: 'rgba(232,184,75,0.1)', border: '1px solid rgba(232,184,75,0.2)', color: '#e8b84b' }}>{team.bingos}✗</span>}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </main>

        {/* ── Right panel ── */}
        <aside style={{ background: 'var(--bg2)', borderLeft: '1px solid rgba(232,184,75,0.10)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Pending submissions */}
          {isOwnerOrMod && pendingSubmissions.length > 0 && (
            <div style={{ borderBottom: '1px solid rgba(232,184,75,0.08)' }}>
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', letterSpacing: '1.5px' }}>PENDING REVIEW</span>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#e8b84b', padding: '2px 7px', borderRadius: '3px', background: 'rgba(232,184,75,0.1)', border: '1px solid rgba(232,184,75,0.2)' }}>{pendingSubmissions.length}</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {pendingSubmissions.map(sub => (
                  <div key={sub.id} style={{ padding: '12px 14px', borderTop: '1px solid rgba(232,184,75,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      {sub.proof_url && (
                        <a href={sub.proof_url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                          <img src={sub.proof_url} alt="proof" style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(232,184,75,0.1)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                        </a>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '13px', color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.tiles?.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: sub.teams?.color ?? '#4a4438', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: '#9a8f7a' }}>{sub.teams?.name} · {sub.users?.display_name}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleReview(sub.id, 'approve')} disabled={reviewingId === sub.id}
                        style={{ flex: 1, padding: '7px', fontFamily: "'Press Start 2P',monospace", fontSize: '6px', borderRadius: '6px', background: 'rgba(62,207,116,0.1)', border: '1px solid rgba(62,207,116,0.25)', color: '#3ecf74', cursor: 'pointer', transition: 'all .15s' }}>
                        {reviewingId === sub.id ? '…' : '✓ APPROVE'}
                      </button>
                      <button onClick={() => handleReview(sub.id, 'reject')} disabled={reviewingId === sub.id}
                        style={{ flex: 1, padding: '7px', fontFamily: "'Press Start 2P',monospace", fontSize: '6px', borderRadius: '6px', background: 'rgba(232,85,85,0.08)', border: '1px solid rgba(232,85,85,0.2)', color: '#e85555', cursor: 'pointer', transition: 'all .15s' }}>
                        ✕ REJECT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          <div style={{ padding: '12px 14px', flex: 1 }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', letterSpacing: '1.5px', marginBottom: '10px' }}>MEMBERS ({members.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[...members].sort((a,b) => a.role==='owner'?-1:b.role==='owner'?1:0).map(member => {
                const usr = member.users
                const team = teams.find(t => t.team_members?.some((tm:any) => tm.event_members?.id === member.id))
                const isMe = usr?.id && displayName && usr.display_name === displayName
                return (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderRadius: '8px', transition: 'background .15s', cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: team ? `${team.color}22` : 'var(--surface2)', border: `1.5px solid ${team ? team.color + '55' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: team?.color ?? '#4a4438' }}>
                      {usr?.display_name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: isMe ? '#e8b84b' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usr?.display_name}</div>
                      {team && <div style={{ fontSize: '11px', color: '#4a4438' }}>{team.name}</div>}
                    </div>
                    {member.role === 'owner' && <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5px', color: '#7a5c1e' }}>★</span>}
                    {member.role === 'moderator' && <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5px', color: '#4b9ef0' }}>M</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Tile modal ── */}
      {selectedTile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => e.target === e.currentTarget && setSelectedTile(null)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid rgba(232,184,75,0.2)', borderRadius: '16px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(232,184,75,0.08)' }}>
              <div>
                {selectedTile.source_raid && (
                  <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: RAID_COLORS[selectedTile.source_raid] ?? '#4a4438', marginBottom: '5px' }}>{selectedTile.source_raid}</div>
                )}
                {selectedTile.is_purple && (
                  <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#a875f0', marginBottom: '5px' }}>⬥ PURPLE DROP</div>
                )}
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '20px', color: 'var(--text)', letterSpacing: '-0.5px' }}>{selectedTile.name}</div>
              </div>
              <button onClick={() => setSelectedTile(null)} style={{ width: '32px', height: '32px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#9a8f7a', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sprite */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '16px', border: `1px solid ${selectedTile.is_purple ? 'rgba(168,117,240,0.3)' : 'rgba(232,184,75,0.15)'}`, background: selectedTile.is_purple ? 'rgba(168,117,240,0.08)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: selectedTile.is_purple ? '0 0 24px rgba(168,117,240,0.15)' : 'none' }}>
                  <img src={selectedTile.sprite_url || W(selectedTile.name)} alt={selectedTile.name}
                    style={{ width: '64px', height: '64px', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9))' }} />
                </div>
              </div>

              {/* State / actions */}
              {(() => {
                const liveTile = tiles.find(t => t.id === selectedTile.id) ?? selectedTile
                const state = getTileState(liveTile, userTeamId)

                if (!userTeamId) return (
                  <p style={{ textAlign: 'center', color: '#9a8f7a', fontSize: '14px', lineHeight: 1.6 }}>
                    You need to be assigned to a team before you can complete tiles.
                  </p>
                )

                if (event.status !== 'live') return (
                  <p style={{ textAlign: 'center', color: '#9a8f7a', fontSize: '14px' }}>
                    This event is not currently live.
                  </p>
                )

                if (state === 'approved') return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(62,207,116,0.08)', border: '1px solid rgba(62,207,116,0.25)', borderRadius: '10px' }}>
                      <span style={{ fontSize: '20px' }}>✓</span>
                      <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: '#3ecf74' }}>Completed!</div>
                        <div style={{ fontSize: '12px', color: '#9a8f7a', marginTop: '2px' }}>Your team has completed this tile.</div>
                      </div>
                    </div>
                    {submitError && <div style={{ fontSize: '13px', color: '#e85555', textAlign: 'center' }}>{submitError}</div>}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setSelectedTile(null)} style={{ flex: 1, height: '42px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', background: 'none', border: '1px solid rgba(232,184,75,0.2)', borderRadius: '8px', color: '#9a8f7a', cursor: 'pointer' }}>Close</button>
                      <button
                        onClick={async () => {
                          setSubmitError('')
                          setCompletingTileId(liveTile.id)
                          const result = await uncompleteTeamTile(liveTile.id, userTeamId!)
                          await refreshTiles()
                          setCompletingTileId(null)
                          if (result?.error) {
                            setSubmitError(result.error)
                          } else {
                            setSelectedTile(null)
                            showToast({ type: 'undo', title: 'Tile uncompleted', subtitle: liveTile.name })
                          }
                        }}
                        disabled={!!completingTileId}
                        style={{ flex: 1, height: '42px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', background: 'none', border: '1px solid rgba(232,85,85,0.25)', borderRadius: '8px', color: '#e85555', cursor: 'pointer', opacity: completingTileId ? 0.5 : 1 }}>
                        {completingTileId === liveTile.id ? 'Undoing…' : 'Undo'}
                      </button>
                    </div>
                  </div>
                )

                if (state === 'pending') return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(232,184,75,0.06)', border: '1px solid rgba(232,184,75,0.2)', borderRadius: '10px' }}>
                      <span style={{ fontSize: '20px' }}>⏳</span>
                      <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: '#e8b84b' }}>Pending Review</div>
                        <div style={{ fontSize: '12px', color: '#9a8f7a', marginTop: '2px' }}>Waiting for a moderator to approve.</div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedTile(null)} style={{ height: '42px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', background: 'none', border: '1px solid rgba(232,184,75,0.2)', borderRadius: '8px', color: '#9a8f7a', cursor: 'pointer' }}>Close</button>
                  </div>
                )

                // Not completed — show Mark as Completed
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {submitError && <div style={{ fontSize: '13px', color: '#e85555', textAlign: 'center' }}>{submitError}</div>}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setSelectedTile(null)}
                        style={{ flex: 1, height: '48px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', background: 'none', border: '1px solid rgba(232,184,75,0.2)', borderRadius: '10px', color: '#9a8f7a', cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button
                        onClick={() => { handleQuickComplete(selectedTile); setSelectedTile(null) }}
                        disabled={!!completingTileId}
                        style={{ flex: 2, height: '48px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '15px', background: selectedTile.is_purple ? '#a875f0' : '#e8b84b', border: 'none', borderRadius: '10px', color: '#0c0a08', cursor: completingTileId ? 'not-allowed' : 'pointer', boxShadow: `0 0 24px ${selectedTile.is_purple ? 'rgba(168,117,240,0.25)' : 'rgba(232,184,75,0.25)'}`, opacity: completingTileId ? 0.6 : 1 }}>
                        {completingTileId ? 'Completing…' : '✓ Mark as Completed'}
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Toast notifications */}
    <ToastArea />

    {/* Bingo celebration */}
    {bingoCelebration && (
      <BingoCelebration
        teamName={bingoCelebration.teamName}
        teamColor={bingoCelebration.teamColor}
        bingoCount={bingoCelebration.count}
        onDismiss={() => setBingoCelebration(null)}
      />
    )}
    </>
  )
}
