'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginClient() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'auth_failed' ? 'Authentication failed. Please try again.' : null
  )

  async function handleDiscord() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') ?? '/dashboard'
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error || !data?.url) {
      setLoading(false)
      setError('Could not connect to Discord. Please try again.')
      return
    }
    window.location.href = data.url
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="login-root">
      <style>{`
        @media(max-width:1024px){.ll{display:none!important}.login-root{grid-template-columns:1fr!important}.rr{grid-column:1/-1!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:32px 20px!important;min-height:100vh!important}}
        .dc:hover:not(:disabled){background:rgba(88,101,242,0.18)!important;border-color:rgba(88,101,242,0.6)!important;transform:translateY(-1px);box-shadow:0 8px 32px rgba(88,101,242,0.2)!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── LEFT — hero panel ── */}
      <div className="ll" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg2)', borderRight: '1px solid rgba(232,184,75,0.2)', padding: '40px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(232,184,75,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(232,184,75,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', top: '-128px', left: '-128px', width: '600px', height: '600px', borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle,rgba(232,184,75,0.07) 0%,transparent 60%)' }} />

        <Link href="/" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,6px)', gridTemplateRows: 'repeat(3,6px)', gap: '2px' }}>
            {[1,0,1,1,1,0,0,1,1].map((on, i) => <span key={i} style={{ display: 'block', borderRadius: '1px', background: on ? '#e8b84b' : 'transparent' }} />)}
          </div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '20px', color: '#f0e8d8', letterSpacing: '-0.5px' }}>
            Tile<em style={{ color: '#e8b84b', fontStyle: 'normal' }}>Scape</em>
          </span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ecf74', boxShadow: '0 0 6px #3ecf74', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#e8b84b', letterSpacing: '1px' }}>2,400+ CLANS ACTIVE</span>
          </div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '52px', lineHeight: 0.95, letterSpacing: '-2px', marginBottom: '24px', color: '#f0e8d8' }}>
            Track every<br /><em style={{ fontStyle: 'normal', color: '#e8b84b' }}>tile.</em><br />Celebrate every<br />purple.
          </h2>
          <p style={{ color: '#9a8f7a', fontSize: '15px', fontWeight: 300, lineHeight: 1.7, maxWidth: '340px' }}>
            The modern bingo & event platform for OSRS clans. No spreadsheets — just your boards, your teams, your drops.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '24px' }}>
          {[{ num: '18k+', label: 'Members' }, { num: '94k+', label: 'Tiles Completed' }, { num: '6.5k+', label: 'Events Hosted' }].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {i > 0 && <div style={{ width: '1px', height: '32px', background: 'rgba(232,184,75,0.2)' }} />}
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '20px', color: '#f0e8d8' }}>{s.num}</div>
                <div style={{ fontSize: '12px', color: '#4a4438' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT — sign in ── */}
      <div className="rr" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', minHeight: '100vh', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '10%', right: 0, width: '500px', height: '500px', borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle,rgba(232,184,75,0.04) 0%,transparent 60%)' }} />

        <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1, animation: 'fadein .4s ease' }}>

          {/* Mobile logo */}
          <div style={{ display: 'none', marginBottom: '32px' }} className="mobile-logo">
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '20px', color: '#f0e8d8' }}>Tile<em style={{ color: '#e8b84b', fontStyle: 'normal' }}>Scape</em></span>
            </Link>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '32px', letterSpacing: '-1px', color: '#f0e8d8', marginBottom: '10px' }}>
              Welcome to TileScape
            </h1>
            <p style={{ color: '#9a8f7a', fontSize: '15px', fontWeight: 300, lineHeight: 1.6 }}>
              Sign in with Discord to access your events,<br />track tiles and manage your clan bingos.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(232,85,85,0.08)', border: '1px solid rgba(232,85,85,0.2)', color: '#e85555', fontSize: '14px', lineHeight: 1.5, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Discord button */}
          <button
            onClick={handleDiscord}
            disabled={loading}
            className="dc"
            style={{
              width: '100%', height: '60px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
              background: 'rgba(88,101,242,0.1)',
              border: '1px solid rgba(88,101,242,0.35)',
              borderRadius: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all .2s',
              marginBottom: '24px',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(88,101,242,0.3)', borderTopColor: '#5865F2', borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '17px', color: '#5865F2' }}>Connecting to Discord…</span>
              </>
            ) : (
              <>
                <svg width="24" height="18" viewBox="0 0 18 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M15.246 1.177A14.9 14.9 0 0011.55.033a.056.056 0 00-.059.028c-.16.285-.337.657-.461.949a13.75 13.75 0 00-4.062 0 9.596 9.596 0 00-.468-.949.058.058 0 00-.059-.028 14.858 14.858 0 00-3.696 1.144.052.052 0 00-.024.021C.444 4.669-.265 8.059.082 11.406a.062.062 0 00.023.042 14.963 14.963 0 004.496 2.272.058.058 0 00.063-.021c.347-.473.655-.972.92-1.496a.057.057 0 00-.031-.08 9.851 9.851 0 01-1.407-.671.058.058 0 01-.006-.096c.095-.071.19-.144.28-.219a.055.055 0 01.058-.008c2.952 1.347 6.15 1.347 9.066 0a.055.055 0 01.059.007c.09.075.184.149.28.22a.058.058 0 01-.005.095 9.242 9.242 0 01-1.408.67.057.057 0 00-.03.082c.27.523.578 1.022.918 1.495a.057.057 0 00.063.022 14.92 14.92 0 004.503-2.272.058.058 0 00.024-.041c.375-3.877-.628-7.241-2.659-10.208a.046.046 0 00-.023-.021zM6.013 9.388c-.875 0-1.597-.803-1.597-1.789 0-.986.707-1.789 1.597-1.789.897 0 1.612.81 1.597 1.789 0 .986-.707 1.789-1.597 1.789zm5.904 0c-.876 0-1.597-.803-1.597-1.789 0-.986.706-1.789 1.597-1.789.897 0 1.612.81 1.597 1.789 0 .986-.7 1.789-1.597 1.789z" fill="#5865F2"/>
                </svg>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '17px', color: '#5865F2' }}>Continue with Discord</span>
              </>
            )}
          </button>

          {/* What to expect */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { icon: '🎯', text: 'Create and join clan bingo events' },
              { icon: '🏆', text: 'Track your team\'s tile completions live' },
              { icon: '🔔', text: 'Get notified when your clan hits a bingo' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.08)' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: '14px', color: '#9a8f7a' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: 'absolute', bottom: '24px', fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', letterSpacing: '1px' }}>
          © 2025 TileScape · Not affiliated with Jagex
        </p>
      </div>
    </div>
  )
}
