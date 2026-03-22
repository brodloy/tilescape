'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteEventVoid } from '@/app/actions/deleteEvent'

const COINS = 'https://oldschool.runescape.wiki/w/Special:FilePath/Coins_10000.png?action=raw'

function formatGP(gp: number): string {
  if (gp >= 1_000_000_000) return `${(gp / 1_000_000_000).toFixed(1)}B`
  if (gp >= 1_000_000) return `${(gp / 1_000_000).toFixed(1)}M`
  if (gp >= 1_000) return `${Math.round(gp / 1_000)}K`
  return gp.toLocaleString()
}

export function EventCard({ event, stats, isOwner, teams = [] }: {
  event: any
  stats?: { total: number; done: number; purples: number; teams: number }
  isOwner?: boolean
  teams?: { id: string; name: string; color: string; done: number; pct: number }[]
}) {
  const [deleting, startDelete] = useTransition()

  const now = new Date()
  const end = event.end_date ? new Date(event.end_date) : null
  const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / 86400000) : null
  const prizePool = event.prize_pool ?? 0

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return
    startDelete(async () => { await deleteEventVoid(event.id) })
  }

  const isLive = event.status === 'live'
  const isEnded = event.status === 'ended'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid rgba(232,184,75,0.12)',
      borderRadius: '16px', overflow: 'hidden',
      transition: 'all .2s',
      position: 'relative',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,184,75,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,184,75,0.12)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* Status bar */}
      <div style={{ height: '3px', background: isLive ? '#3ecf74' : isEnded ? '#2a2520' : 'rgba(232,184,75,0.3)' }} />

      <div style={{ padding: '20px 22px' }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <StatusBadge status={event.status} />
          {event.myRole === 'owner' && <RoleBadge role="owner" />}
          {event.myRole === 'moderator' && <RoleBadge role="moderator" />}
          {daysLeft !== null && isLive && (
            <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', marginLeft: 'auto', color: daysLeft <= 1 ? '#e85555' : daysLeft <= 3 ? '#e8b84b' : '#9a8f7a' }}>
              {daysLeft <= 0 ? 'ENDS TODAY' : `${daysLeft}D LEFT`}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '22px', letterSpacing: '-0.6px', color: '#f0e8d8', marginBottom: '6px', lineHeight: 1.1 }}>
          {event.name}
        </h3>
        {event.description && (
          <p style={{ fontSize: '14px', color: '#9a8f7a', fontWeight: 300, lineHeight: 1.5, marginBottom: '14px', margin: '0 0 14px' }}>
            {event.description}
          </p>
        )}

        {/* Prize pool */}
        {prizePool > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: 'rgba(232,184,75,0.05)', border: '1px solid rgba(232,184,75,0.18)', borderRadius: '12px', marginBottom: '18px' }}>
            <img src={COINS} alt="GP" style={{ width: '44px', height: '44px', imageRendering: 'pixelated', flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(232,184,75,0.35))' }} />
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '28px', color: '#e8b84b', letterSpacing: '-1px', lineHeight: 1 }}>{formatGP(prizePool)}</div>
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#7a5c1e', marginTop: '5px', letterSpacing: '1px' }}>PRIZE POOL</div>
            </div>
          </div>
        )}

        {/* Team progress */}
        {teams.length > 0 && stats && stats.total > 0 && (
          <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {teams.map((team, i) => (
              <div key={team.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: team.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: '13px', color: '#9a8f7a' }}>{team.name}</span>
                  </div>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '13px', color: team.color }}>
                    {team.done}<span style={{ color: '#4a4438', fontWeight: 400 }}>/{stats.total}</span>
                  </span>
                </div>
                <div style={{ height: '5px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '3px', width: `${team.pct}%`, background: team.color, transition: `width .8s cubic-bezier(.4,0,.2,1) ${i * 80}ms`, minWidth: team.pct > 0 ? '4px' : '0' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {teams.length === 0 && stats && stats.total > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '13px', color: '#9a8f7a' }}>{stats.done} of {stats.total} tiles</span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '15px', color: '#9a8f7a' }}>{Math.round(stats.done / Math.max(stats.total, 1) * 100)}%</span>
            </div>
            <div style={{ height: '5px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '3px', width: `${Math.round(stats.done / Math.max(stats.total, 1) * 100)}%`, background: 'rgba(232,184,75,0.4)', transition: 'width .6s' }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(232,184,75,0.08)', gap: '10px' }}>
          <InviteCodeGroup code={event.invite_code} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            {isOwner && !isEnded && (
              <Link href={`/events/${event.id}/manage`} onClick={e => e.stopPropagation()}
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '13px', padding: '8px 14px', borderRadius: '7px', background: 'none', border: '1px solid rgba(232,184,75,0.2)', color: '#9a8f7a', textDecoration: 'none' }}>
                Manage
              </Link>
            )}
            {isOwner && (
              <button onClick={handleDelete} disabled={deleting}
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '13px', padding: '8px 14px', borderRadius: '7px', background: 'none', border: '1px solid rgba(232,85,85,0.2)', color: deleting ? '#4a4438' : '#e85555', cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <Link href={`/events/${event.id}`} onClick={e => e.stopPropagation()}
              style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '13px', padding: '8px 18px', borderRadius: '7px', background: '#e8b84b', color: '#0c0a08', textDecoration: 'none', boxShadow: '0 0 18px rgba(232,184,75,0.2)', flexShrink: 0 }}>
              View Board →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    live:  { bg: 'rgba(62,207,116,0.1)',  color: '#3ecf74', border: 'rgba(62,207,116,0.3)'  },
    draft: { bg: 'rgba(154,143,122,0.08)', color: '#9a8f7a', border: 'rgba(154,143,122,0.2)' },
    ended: { bg: 'rgba(74,68,56,0.25)',    color: '#4a4438', border: 'rgba(74,68,56,0.35)'  },
  }
  const s = styles[status] ?? styles.draft
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'Press Start 2P',monospace", fontSize: '10px', padding: '5px 11px', borderRadius: '5px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status === 'live' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3ecf74', boxShadow: '0 0 5px #3ecf74', animation: 'pulse 2s infinite' }} />}
      {status.toUpperCase()}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const c = role === 'owner' ? { color: '#7a5c1e', bg: 'rgba(232,184,75,0.07)', border: 'rgba(232,184,75,0.15)' } : { color: '#4b9ef0', bg: 'rgba(75,158,240,0.08)', border: 'rgba(75,158,240,0.2)' }
  return <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: c.color, padding: '4px 10px', borderRadius: '4px', background: c.bg, border: `1px solid ${c.border}` }}>{role.toUpperCase()}</span>
}

// ── Tile showcase — replaces the tiny scrolling icons ─────────────────────────

// ── Invite code group ─────────────────────────────────────────────────────────
function InviteCodeGroup({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    navigator.clipboard.writeText(`https://tilescape.vercel.app/join?code=${code}`)
    setCopied(true); setTimeout(() => setCopied(false), 2200)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(232,184,75,0.2)', flexShrink: 0 }}>
      <div style={{ padding: '0 14px', background: 'rgba(232,184,75,0.06)', borderRight: '1px solid rgba(232,184,75,0.14)', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#7a5c1e', letterSpacing: '1px' }}>INVITE</span>
      </div>
      <div style={{ padding: '12px 16px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(232,184,75,0.14)' }}>
        <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '14px', color: '#e8b84b', letterSpacing: '5px', lineHeight: 1 }}>{code}</span>
      </div>
      <button onClick={handleCopy} style={{ padding: '0 16px', background: copied ? 'rgba(62,207,116,0.12)' : 'var(--bg3)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background .2s', color: copied ? '#3ecf74' : '#9a8f7a' }}>
        {copied ? (
          <><svg width="14" height="14" viewBox="0 0 13 13" fill="none"><path d="M2 7L5 10L11 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px' }}>COPIED</span></>
        ) : (
          <><svg width="14" height="14" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="1.5" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 4.5H2A1.5 1.5 0 0 0 .5 6v5A1.5 1.5 0 0 0 2 12.5h5A1.5 1.5 0 0 0 8.5 11v-.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px' }}>COPY</span></>
        )}
      </button>
    </div>
  )
}
