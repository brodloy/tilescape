'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export function UserMenu({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = displayName?.substring(0, 2).toUpperCase() ?? '??'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px 4px 4px',
          borderRadius: '20px',
          border: '1px solid rgba(232,184,75,0.15)',
          background: open ? 'var(--surface2)' : 'var(--surface)',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'rgba(232,184,75,0.15)',
          border: '1px solid rgba(232,184,75,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--gold)',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
          {displayName}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text3)', transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '180px',
          background: 'var(--bg2)',
          border: '1px solid rgba(232,184,75,0.18)',
          borderRadius: '10px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          zIndex: 200,
        }}>
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(232,184,75,0.08)' }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: 'var(--text3)', letterSpacing: '1px' }}>SIGNED IN AS</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px', color: 'var(--gold)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          </div>
          <div style={{ padding: '6px' }}>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px', borderRadius: '6px',
                color: 'var(--text2)', textDecoration: 'none', fontSize: '13px',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}
            >
              <span style={{ fontSize: '14px' }}>⚙</span> Settings
            </Link>
            <div style={{ height: '1px', background: 'rgba(232,184,75,0.08)', margin: '4px 0' }} />
            <form action={signOut}>
              <button
                type="submit"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: '6px', width: '100%',
                  background: 'none', border: 'none',
                  color: 'var(--text3)', fontSize: '13px', cursor: 'pointer',
                  transition: 'all .15s', textAlign: 'left',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,85,85,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--red)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text3)' }}
              >
                <span style={{ fontSize: '14px' }}>↪</span> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
