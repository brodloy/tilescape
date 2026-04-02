'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { Avatar } from '@/components/ui/Avatar'

interface Props {
  displayName: string
  avatarUrl?: string | null
  context?: React.ReactNode
  actions?: React.ReactNode
}

export function AppNav({ displayName, avatarUrl, context, actions }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center',
      height: '64px', padding: '0 16px', gap: '8px',
      background: 'rgba(12,10,8,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(232,184,75,0.12)',
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,6px)', gridTemplateRows: 'repeat(3,6px)', gap: '2px' }}>
          {[1,0,1,1,1,0,0,1,1].map((on, i) => (
            <span key={i} style={{ display: 'block', background: on ? '#e8b84b' : 'transparent', borderRadius: '1px' }} />
          ))}
        </div>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: '#f0e8d8', letterSpacing: '-0.5px' }}>
          Tile<em style={{ color: '#e8b84b', fontStyle: 'normal' }}>Scape</em>
        </span>
      </Link>

      {/* Centre context — hidden on small screens */}
      {context && (
        <div className="app-nav-centre" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minWidth: 0 }}>
          {context}
        </div>
      )}
      {!context && <div style={{ flex: 1 }} />}
      {context && <div style={{ flex: '0 0 0' }} />}

      {/* Right slot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
        {actions && (
          <div className="app-nav-actions" style={{ display: 'flex', gap: '6px' }}>
            {actions}
          </div>
        )}

        {/* User dropdown — avatar only on mobile */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button onClick={() => setOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px', borderRadius: '999px',
            background: open ? 'var(--surface2)' : 'transparent',
            border: 'none', cursor: 'pointer', transition: 'all .15s',
          }}>
            <Avatar src={avatarUrl} name={displayName} size={34} />
            <span className="app-nav-name" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: '13px', color: '#f0e8d8', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="app-nav-name" style={{ color: '#4a4438', transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '200px',
              background: 'var(--bg2)', border: '1px solid rgba(232,184,75,0.18)',
              borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{ padding: '14px', borderBottom: '1px solid rgba(232,184,75,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar src={avatarUrl} name={displayName} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#4a4438', letterSpacing: '1px', marginBottom: '4px' }}>SIGNED IN AS</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: '#e8b84b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                </div>
              </div>
              <div style={{ padding: '6px' }}>
                <Link href="/dashboard" onClick={() => setOpen(false)} style={menuItemStyle}>
                  <span>⊞</span> Dashboard
                </Link>
                <Link href="/account" onClick={() => setOpen(false)} style={menuItemStyle}>
                  <span>⚙</span> Settings
                </Link>
                <div style={{ height: '1px', background: 'rgba(232,184,75,0.08)', margin: '4px 0' }} />
                <form action={signOut}>
                  <button type="submit" style={{ ...menuItemStyle, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,85,85,0.08)'; (e.currentTarget as HTMLElement).style.color = '#e85555' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#9a8f7a' }}>
                    <span>↪</span> Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .app-nav-name { display: none !important; }
          .app-nav-centre { display: none !important; }
          .app-nav-actions { display: none !important; }
        }
        @media (max-width: 900px) {
          .app-nav-centre { display: none !important; }
        }
      `}</style>
    </nav>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '9px 12px', borderRadius: '8px', width: '100%',
  color: '#9a8f7a', textDecoration: 'none', fontSize: '14px',
  fontFamily: "'DM Sans',sans-serif", transition: 'all .15s',
}
