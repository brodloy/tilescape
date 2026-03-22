'use client'

import Link from 'next/link'

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  live:  { bg: 'rgba(62,207,116,0.1)',   color: '#3ecf74', border: 'rgba(62,207,116,0.25)',  label: 'LIVE'  },
  draft: { bg: 'rgba(154,143,122,0.08)', color: '#9a8f7a', border: 'rgba(154,143,122,0.15)', label: 'DRAFT' },
  ended: { bg: 'rgba(74,68,56,0.3)',     color: '#4a4438', border: 'rgba(74,68,56,0.4)',     label: 'ENDED' },
}

export function EventCard({ event, stats }: {
  event: any
  stats?: { total: number; done: number; purples: number; teams: number }
}) {
  const now = new Date()
  const end = event.end_date ? new Date(event.end_date) : null
  const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / 86400000) : null
  const pct = stats ? Math.round(stats.done / Math.max(stats.total, 1) * 100) : 0
  const st = STATUS_STYLES[event.status] ?? STATUS_STYLES.draft

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(232,184,75,0.10)',
          borderRadius: '12px', overflow: 'hidden',
          transition: 'all .15s', cursor: 'pointer',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'rgba(232,184,75,0.28)'
          el.style.background = 'var(--surface2)'
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'rgba(232,184,75,0.10)'
          el.style.background = 'var(--surface)'
          el.style.transform = 'none'
          el.style.boxShadow = 'none'
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: '3px', background: event.status === 'live' ? '#3ecf74' : event.status === 'ended' ? '#4a4438' : 'rgba(232,184,75,0.3)' }} />

        <div style={{ padding: '18px 20px' }}>
          {/* Status + role */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: '6px',
              padding: '3px 8px', borderRadius: '3px',
              background: st.bg, color: st.color, border: `1px solid ${st.border}`,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              {event.status === 'live' && (
                <span style={{ width: '4px', height: '4px', background: '#3ecf74', borderRadius: '50%', display: 'inline-block' }} />
              )}
              {st.label}
            </div>
            {event.myRole === 'owner' && (
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: '#7a5c1e' }}>OWNER</span>
            )}
            {event.myRole === 'moderator' && (
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: '#4b9ef0' }}>MOD</span>
            )}
          </div>

          {/* Title */}
          <div style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: '18px', letterSpacing: '-0.5px',
            color: '#f0e8d8', marginBottom: '6px', lineHeight: 1.1,
          }}>
            {event.name}
          </div>
          {event.description && (
            <p style={{
              fontSize: '13px', color: '#9a8f7a', fontWeight: 300,
              lineHeight: 1.5, marginBottom: '16px',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {event.description}
            </p>
          )}

          {/* Progress bar */}
          {stats && stats.total > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: '#4a4438' }}>PROGRESS</span>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: event.status === 'live' ? '#3ecf74' : '#9a8f7a' }}>{pct}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px', width: `${pct}%`,
                  background: event.status === 'live' ? '#3ecf74' : event.status === 'ended' ? '#4a4438' : '#e8b84b',
                  transition: 'width .5s', position: 'relative',
                }}>
                  <div style={{ position: 'absolute', top: '1px', left: '2px', right: '2px', height: '40%', background: 'rgba(255,255,255,0.25)', borderRadius: '2px 2px 0 0' }} />
                </div>
              </div>
            </div>
          )}

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {stats && (
              <>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '5.5px', padding: '3px 8px', borderRadius: '3px', background: 'var(--surface2)', border: '1px solid rgba(232,184,75,0.1)', color: '#9a8f7a' }}>
                  {stats.done}/{stats.total} TILES
                </span>
                {stats.teams > 0 && (
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '5.5px', padding: '3px 8px', borderRadius: '3px', background: 'var(--surface2)', border: '1px solid rgba(232,184,75,0.1)', color: '#9a8f7a' }}>
                    {stats.teams} TEAM{stats.teams !== 1 ? 'S' : ''}
                  </span>
                )}
                {stats.purples > 0 && (
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '5.5px', padding: '3px 8px', borderRadius: '3px', background: 'rgba(168,117,240,0.1)', border: '1px solid rgba(168,117,240,0.2)', color: '#a875f0' }}>
                    {stats.purples} PURPLE{stats.purples !== 1 ? 'S' : ''}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(232,184,75,0.08)' }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#4a4438', letterSpacing: '2px' }}>{event.invite_code}</span>
            {daysLeft !== null && event.status === 'live' && (
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: daysLeft <= 1 ? '#e85555' : daysLeft <= 3 ? '#e8b84b' : '#4a4438' }}>
                {daysLeft <= 0 ? 'ENDS TODAY' : `${daysLeft}D LEFT`}
              </span>
            )}
            {event.status === 'ended' && (
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: '#4a4438' }}>ENDED</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
