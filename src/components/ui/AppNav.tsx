'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

interface Props {
  displayName: string
  context?: React.ReactNode   // centre slot — event name, page title etc
  actions?: React.ReactNode   // right slot — extra buttons before user menu
}

export function AppNav({ displayName, context, actions }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const initials = displayName?.substring(0, 2).toUpperCase() ?? '??'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center',
      height: '64px', padding: '0 32px', gap: '16px',
      background: 'rgba(12,10,8,0.88)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(232,184,75,0.12)',
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,6px)', gridTemplateRows: 'repeat(3,6px)', gap: '2px' }}>
          {[1,0,1,1,1,0,0,1,1].map((on, i) => (
            <span key={i} style={{ display: 'block', background: on ? '#e8b84b' : 'transparent', borderRadius: '1px' }} />
          ))}
        </div>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '18px', color: '#f0e8d8', letterSpacing: '-0.5px' }}>
          Tile<em style={{ color: '#e8b84b', fontStyle: 'normal' }}>Scape</em>
        </span>
      </Link>

      {/* Centre context */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {context}
      </div>

      {/* Right slot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {actions}

        {/* User dropdown */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button onClick={() => setOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 12px 5px 5px', borderRadius: '999px',
            background: open ? 'var(--surface2)' : 'var(--surface)',
            border: '1px solid rgba(232,184,75,0.15)', cursor: 'pointer', transition: 'all .15s',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'rgba(232,184,75,0.15)', border: '1px solid rgba(232,184,75,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#e8b84b', flexShrink: 0,
            }}>{initials}</div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: '13px', color: '#f0e8d8' }}>{displayName}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: '#4a4438', transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '200px',
              background: 'var(--bg2)', border: '1px solid rgba(232,184,75,0.18)',
              borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(232,184,75,0.08)' }}>
                <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', letterSpacing: '1px' }}>SIGNED IN AS</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: '#e8b84b', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
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
    </nav>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '9px 12px', borderRadius: '8px', width: '100%',
  color: '#9a8f7a', textDecoration: 'none', fontSize: '14px',
  fontFamily: "'DM Sans',sans-serif", transition: 'all .15s',
}
