'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteEventVoid } from '@/app/actions/deleteEvent'

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string; dot: boolean }> = {
  live:  { bg: 'rgba(62,207,116,0.1)',   color: '#3ecf74', border: 'rgba(62,207,116,0.3)',  label: 'LIVE',  dot: true  },
  draft: { bg: 'rgba(154,143,122,0.08)', color: '#9a8f7a', border: 'rgba(154,143,122,0.2)', label: 'DRAFT', dot: false },
  ended: { bg: 'rgba(74,68,56,0.25)',    color: '#4a4438', border: 'rgba(74,68,56,0.35)',   label: 'ENDED', dot: false },
}

export function EventCard({ event, stats, isOwner, tiles = [], teams = [] }: {
  event: any
  stats?: { total: number; done: number; purples: number; teams: number }
  isOwner?: boolean
  tiles?: any[]
  teams?: { id: string; name: string; color: string; done: number; pct: number }[]
}) {
  const [hovered, setHovered] = useState(false)
  const [deleting, startDelete] = useTransition()

  const now = new Date()
  const end = event.end_date ? new Date(event.end_date) : null
  const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / 86400000) : null
  const pct = stats ? Math.round(stats.done / Math.max(stats.total, 1) * 100) : 0
  const st = STATUS_STYLES[event.status] ?? STATUS_STYLES.draft

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return
    startDelete(async () => { await deleteEventVoid(event.id) })
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'rgba(232,184,75,0.28)' : 'rgba(232,184,75,0.10)'}`,
        borderRadius: '14px', overflow: 'hidden',
        transition: 'all .2s',
        boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.5)' : 'none',
        position: 'relative',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: '3px',
        background: event.status === 'live' ? '#3ecf74'
          : event.status === 'ended' ? '#2a2520'
          : 'rgba(232,184,75,0.35)',
      }} />

      <div style={{ padding: '22px 24px' }}>
        {/* Top row — status + role badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontFamily: "'Press Start 2P', monospace", fontSize: '12px',
            padding: '5px 12px', borderRadius: '4px',
            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
          }}>
            {st.dot && <span style={{ width: '5px', height: '5px', background: '#3ecf74', borderRadius: '50%', boxShadow: '0 0 5px #3ecf74', flexShrink: 0 }} />}
            {st.label}
          </div>
          {event.myRole === 'owner' && (
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#7a5c1e', padding: '4px 10px', borderRadius: '4px', background: 'rgba(232,184,75,0.07)', border: '1px solid rgba(232,184,75,0.15)' }}>OWNER</span>
          )}
          {event.myRole === 'moderator' && (
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#4b9ef0', padding: '4px 10px', borderRadius: '4px', background: 'rgba(75,158,240,0.08)', border: '1px solid rgba(75,158,240,0.2)' }}>MOD</span>
          )}
          {daysLeft !== null && event.status === 'live' && (
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', marginLeft: 'auto', color: daysLeft <= 1 ? '#e85555' : daysLeft <= 3 ? '#e8b84b' : '#9a8f7a' }}>
              {daysLeft <= 0 ? 'ENDS TODAY' : `${daysLeft}D LEFT`}
            </span>
          )}
        </div>

        {/* Title + description */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: '24px', letterSpacing: '-0.8px',
            color: hovered ? '#e8b84b' : '#f0e8d8',
            marginBottom: '6px', lineHeight: 1.1,
            transition: 'color .2s',
          }}>
            {event.name}
          </h3>
          {event.description && (
            <p style={{ fontSize: '14px', color: '#9a8f7a', fontWeight: 300, lineHeight: 1.6, margin: 0 }}>
              {event.description}
            </p>
          )}
        </div>

        {/* Mini board preview */}
        {tiles.length > 0 && <MiniBoard tiles={tiles} status={event.status} />}

        {/* Per-team progress bars */}
        {teams.length > 0 && stats && stats.total > 0 && (
          <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {teams.map((team, i) => (
              <div key={team.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: team.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: '#9a8f7a' }}>{team.name}</span>
                  </div>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '13px', color: team.color, letterSpacing: '-0.3px' }}>
                    {team.done}<span style={{ color: '#4a4438', fontWeight: 400 }}>/{stats.total}</span>
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${team.pct}%`,
                    background: team.color,
                    transition: `width .8s cubic-bezier(.4,0,.2,1) ${i * 80}ms`,
                    minWidth: team.pct > 0 ? '6px' : '0',
                    position: 'relative',
                  }}>
                    <div style={{ position: 'absolute', top: '1px', left: '2px', right: '2px', height: '40%', background: 'rgba(255,255,255,0.25)', borderRadius: '2px 2px 0 0' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fallback overall bar when no teams */}
        {teams.length === 0 && stats && stats.total > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#9a8f7a' }}>{stats.done} of {stats.total} tiles</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', color: '#9a8f7a' }}>{pct}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: 'rgba(232,184,75,0.5)', transition: 'width .6s' }} />
            </div>
          </div>
        )}

        {/* Footer — invite code group + action buttons */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '16px', borderTop: '1px solid rgba(232,184,75,0.08)',
          gap: '12px',
        }}>
          {/* Invite code pill group */}
          <InviteCodeGroup code={event.invite_code} />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isOwner && event.status !== 'ended' && (
              <Link href={`/events/${event.id}/manage`}
                onClick={e => e.stopPropagation()}
                style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px',
                  padding: '9px 16px', borderRadius: '7px',
                  background: 'none', border: '1px solid rgba(232,184,75,0.2)',
                  color: '#9a8f7a', textDecoration: 'none', transition: 'all .15s',
                }}>
                Manage
              </Link>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px',
                  padding: '9px 16px', borderRadius: '7px',
                  background: 'none', border: '1px solid rgba(232,85,85,0.2)',
                  color: deleting ? '#4a4438' : '#e85555', cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all .15s',
                }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <Link href={`/events/${event.id}`}
              onClick={e => e.stopPropagation()}
              style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px',
                padding: '9px 20px', borderRadius: '7px',
                background: '#e8b84b', color: '#0c0a08',
                textDecoration: 'none', transition: 'all .15s',
                boxShadow: '0 0 20px rgba(232,184,75,0.2)',
                flexShrink: 0,
              }}>
              View Board →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


function InviteCodeGroup({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    navigator.clipboard.writeText(`https://tilescape.vercel.app/join?code=${code}`)
    setCopied(true); setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: '11px', overflow: 'hidden', border: '1px solid rgba(232,184,75,0.22)', flexShrink: 0 }}>
      {/* Label segment */}
      <div style={{
        padding: '0 16px',
        background: 'rgba(232,184,75,0.07)',
        borderRight: '1px solid rgba(232,184,75,0.14)',
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#7a5c1e', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>
          INVITE
        </span>
      </div>

      {/* Code segment */}
      <div style={{
        padding: '14px 18px',
        background: 'var(--bg3)',
        display: 'flex', alignItems: 'center',
        borderRight: '1px solid rgba(232,184,75,0.14)',
      }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: '#e8b84b', letterSpacing: '5px', lineHeight: 1 }}>
          {code}
        </span>
      </div>

      {/* Copy button segment */}
      <button
        onClick={handleCopy}
        title="Copy join link"
        style={{
          padding: '0 18px',
          background: copied ? 'rgba(62,207,116,0.12)' : 'var(--bg3)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
          transition: 'background .2s',
          color: copied ? '#3ecf74' : '#9a8f7a',
        }}
      >
        {copied ? (
          <>
            <svg width="15" height="15" viewBox="0 0 13 13" fill="none">
              <path d="M2 7L5 10L11 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', whiteSpace: 'nowrap' }}>COPIED</span>
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 13 13" fill="none">
              <rect x="4.5" y="1.5" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M2.5 4.5H2A1.5 1.5 0 0 0 .5 6v5A1.5 1.5 0 0 0 2 12.5h5A1.5 1.5 0 0 0 8.5 11v-.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', whiteSpace: 'nowrap' }}>COPY</span>
          </>
        )}
      </button>
    </div>
  )
}

function MiniBoard({ tiles, status }: { tiles: any[]; status: string }) {
  if (tiles.length === 0) return null

  const nonFree = tiles.filter(t => !t.free_space && t.sprite_url)
  if (nonFree.length === 0) return null

  // Sort: approved first, then purples, then rest
  const sorted = [...nonFree].sort((a, b) => {
    const aApproved = a.tile_completions?.some((c: any) => c.status === 'approved') ? 2 : 0
    const bApproved = b.tile_completions?.some((c: any) => c.status === 'approved') ? 2 : 0
    const aPurple = a.is_purple ? 1 : 0
    const bPurple = b.is_purple ? 1 : 0
    return (bApproved + bPurple) - (aApproved + aPurple)
  })

  // Duplicate for seamless loop
  const items = [...sorted, ...sorted]
  const itemW = 40 // px per item including gap
  const totalW = sorted.length * itemW

  return (
    <div style={{ marginBottom: '16px', position: 'relative', overflow: 'hidden', height: '36px' }}>
      {/* Left fade */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '32px', background: 'linear-gradient(90deg, var(--surface), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      {/* Right fade */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '32px', background: 'linear-gradient(270deg, var(--surface), transparent)', zIndex: 2, pointerEvents: 'none' }} />

      <div style={{
        display: 'flex', gap: '6px', alignItems: 'center',
        animation: `tilescroll ${sorted.length * 1.4}s linear infinite`,
        width: 'max-content',
      }}>
        {items.map((tile, i) => {
          const approved = tile.tile_completions?.some((c: any) => c.status === 'approved')
          return (
            <div key={i} style={{
              width: '34px', height: '34px', flexShrink: 0, borderRadius: '6px',
              background: approved ? 'rgba(62,207,116,0.12)' : tile.is_purple ? 'rgba(168,117,240,0.08)' : 'var(--bg3)',
              border: `1px solid ${approved ? 'rgba(62,207,116,0.3)' : tile.is_purple ? 'rgba(168,117,240,0.2)' : 'rgba(255,255,255,0.05)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <img src={tile.sprite_url} alt={tile.name}
                style={{ width: '72%', height: '72%', objectFit: 'contain', imageRendering: 'pixelated', filter: approved ? 'brightness(1.1)' : 'grayscale(0.4) brightness(0.7)' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
              {approved && (
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#3ecf74', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                    <path d="M1 2.5L2.5 4L5 1" stroke="#041a0c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              {tile.is_purple && !approved && (
                <div style={{ position: 'absolute', top: '2px', left: '2px', width: '4px', height: '4px', background: '#a875f0', borderRadius: '1px' }} />
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes tilescroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-${totalW + sorted.length * 6}px); }
        }
      `}</style>
    </div>
  )
}
