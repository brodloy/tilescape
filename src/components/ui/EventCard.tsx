'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteEventVoid } from '@/app/actions/deleteEvent'

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string; dot: boolean }> = {
  live:  { bg: 'rgba(62,207,116,0.1)',   color: '#3ecf74', border: 'rgba(62,207,116,0.3)',  label: 'LIVE',  dot: true  },
  draft: { bg: 'rgba(154,143,122,0.08)', color: '#9a8f7a', border: 'rgba(154,143,122,0.2)', label: 'DRAFT', dot: false },
  ended: { bg: 'rgba(74,68,56,0.25)',    color: '#4a4438', border: 'rgba(74,68,56,0.35)',   label: 'ENDED', dot: false },
}

export function EventCard({ event, stats, isOwner }: {
  event: any
  stats?: { total: number; done: number; purples: number; teams: number }
  isOwner?: boolean
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

        {/* Progress bar */}
        {stats && stats.total > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9a8f7a', fontWeight: 500 }}>
                {stats.done} of {stats.total} tiles completed
              </span>
              <span style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px',
                color: event.status === 'live' ? '#3ecf74' : '#9a8f7a',
                letterSpacing: '-0.5px',
              }}>{pct}%</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{
                height: '100%', borderRadius: '4px', width: `${pct}%`,
                background: event.status === 'live' ? 'linear-gradient(90deg, #3ecf74, #5ee890)'
                  : event.status === 'ended' ? '#2a2520'
                  : 'linear-gradient(90deg, #e8b84b, #f0c85a)',
                transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                position: 'relative', minWidth: pct > 0 ? '8px' : '0',
              }}>
                <div style={{ position: 'absolute', top: '1px', left: '2px', right: '2px', height: '40%', background: 'rgba(255,255,255,0.2)', borderRadius: '3px 3px 0 0' }} />
              </div>
            </div>
          </div>
        )}

        {/* Stat pills row */}
        {stats && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Chip label={`${stats.done}/${stats.total} Tiles`} />
            {stats.teams > 0 && <Chip label={`${stats.teams} Team${stats.teams !== 1 ? 's' : ''}`} />}
            {stats.purples > 0 && <Chip label={`${stats.purples} Purple${stats.purples !== 1 ? 's' : ''}`} color="#a875f0" border="rgba(168,117,240,0.2)" bg="rgba(168,117,240,0.08)" />}
          </div>
        )}

        {/* Footer — invite code + copy + action buttons */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '16px', borderTop: '1px solid rgba(232,184,75,0.08)',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#4a4438', letterSpacing: '1px', marginBottom: '5px' }}>INVITE CODE</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '13px', color: '#e8b84b', letterSpacing: '4px' }}>{event.invite_code}</div>
            </div>
            <CopyCodeButton code={event.invite_code} />
          </div>

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

function Chip({ label, color = '#9a8f7a', border = 'rgba(232,184,75,0.12)', bg = 'var(--surface2)' }: { label: string; color?: string; border?: string; bg?: string }) {
  return (
    <span style={{
      fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '13px',
      padding: '4px 12px', borderRadius: '20px',
      background: bg, border: `1px solid ${border}`, color,
    }}>
      {label}
    </span>
  )
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    navigator.clipboard.writeText(`https://tilescape.vercel.app/join?code=${code}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} style={{
      fontFamily: "'Press Start 2P', monospace", fontSize: '9px',
      padding: '7px 12px', borderRadius: '6px', cursor: 'pointer',
      border: copied ? '1px solid rgba(62,207,116,0.4)' : '1px solid rgba(232,184,75,0.2)',
      background: copied ? 'rgba(62,207,116,0.08)' : 'rgba(232,184,75,0.06)',
      color: copied ? '#3ecf74' : '#9a8f7a',
      transition: 'all .2s', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {copied ? '✓ COPIED' : '📋 COPY'}
    </button>
  )
}
