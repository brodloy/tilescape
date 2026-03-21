'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithDiscord,
  signInWithGoogle,
} from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Tab = 'login' | 'register'

export function LoginClient() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'auth_failed'
      ? 'Authentication failed. Please try again.'
      : null
  )
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
    setSuccess(null)
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await signInWithEmail(formData)
      if (result?.error) setError(result.error)
    })
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await signUpWithEmail(formData)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between bg-bg2 border-r border-[rgba(232,184,75,0.20)] px-12 py-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: 'linear-gradient(rgba(232,184,75,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.07) 0%, transparent 60%)' }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5 no-underline">
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(3, 6px)', gridTemplateRows: 'repeat(3, 6px)' }}>
            {[1,0,1,1,1,0,0,1,1].map((on, i) => (
              <span key={i} className="block rounded-[1px]" style={{ background: on ? '#e8b84b' : 'transparent' }} />
            ))}
          </div>
          <span className="font-syne font-extrabold text-xl tracking-tight">
            Tile<span className="text-gold">Scape</span>
          </span>
        </Link>

        {/* Hero copy */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_6px_#3ecf74] animate-pulse" />
            <span className="font-pixel text-[7px] text-gold tracking-wider">2,400+ clans active right now</span>
          </div>
          <h2 className="font-syne font-extrabold text-5xl leading-[0.95] tracking-tight mb-5">
            Track every<br /><em className="not-italic text-gold">tile.</em><br />Celebrate every<br />purple.
          </h2>
          <p className="text-text-2 text-sm font-light leading-relaxed max-w-sm">
            The modern bingo & event platform for OSRS clans. No spreadsheets — just your boards, your teams, your drops.
          </p>
        </div>

        {/* Foot stats */}
        <div className="relative z-10 flex items-center gap-6">
          {[
            { num: '18k+', label: 'Members' },
            { num: '94k+', label: 'Tiles Completed' },
            { num: '6.5k+', label: 'Events Hosted' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-6">
              {i > 0 && <div className="w-px h-8 bg-[rgba(232,184,75,0.20)]" />}
              <div>
                <div className="font-syne font-extrabold text-xl tracking-tight">{s.num}</div>
                <div className="text-xs text-text-3">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-col items-center justify-center px-6 py-10 min-h-screen relative">
        <div className="absolute bottom-32 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.04) 0%, transparent 60%)' }}
        />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="font-syne font-extrabold text-xl tracking-tight">
              Tile<span className="text-gold">Scape</span>
            </Link>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-surface border border-[rgba(232,184,75,0.20)] rounded-lg p-1 mb-8">
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 rounded-md font-syne font-bold text-sm transition-all duration-150 ${
                  tab === t
                    ? 'bg-surface2 text-text'
                    : 'text-text-2 hover:text-text'
                }`}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {/* OAuth buttons */}
          <div className="flex gap-2.5 mb-6">
            <button
              onClick={() => startTransition(async () => { await signInWithDiscord() })}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 h-11 bg-surface border border-[rgba(232,184,75,0.20)] rounded hover:bg-surface2 hover:border-[rgba(232,184,75,0.35)] transition-all text-sm font-medium disabled:opacity-50"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <path d="M15.246 1.177A14.9 14.9 0 0011.55.033a.056.056 0 00-.059.028c-.16.285-.337.657-.461.949a13.75 13.75 0 00-4.062 0 9.596 9.596 0 00-.468-.949.058.058 0 00-.059-.028 14.858 14.858 0 00-3.696 1.144.052.052 0 00-.024.021C.444 4.669-.265 8.059.082 11.406a.062.062 0 00.023.042 14.963 14.963 0 004.496 2.272.058.058 0 00.063-.021c.347-.473.655-.972.92-1.496a.057.057 0 00-.031-.08 9.851 9.851 0 01-1.407-.671.058.058 0 01-.006-.096c.095-.071.19-.144.28-.219a.055.055 0 01.058-.008c2.952 1.347 6.15 1.347 9.066 0a.055.055 0 01.059.007c.09.075.184.149.28.22a.058.058 0 01-.005.095 9.242 9.242 0 01-1.408.67.057.057 0 00-.03.082c.27.523.578 1.022.918 1.495a.057.057 0 00.063.022 14.92 14.92 0 004.503-2.272.058.058 0 00.024-.041c.375-3.877-.628-7.241-2.659-10.208a.046.046 0 00-.023-.021zM6.013 9.388c-.875 0-1.597-.803-1.597-1.789 0-.986.707-1.789 1.597-1.789.897 0 1.612.81 1.597 1.789 0 .986-.707 1.789-1.597 1.789zm5.904 0c-.876 0-1.597-.803-1.597-1.789 0-.986.706-1.789 1.597-1.789.897 0 1.612.81 1.597 1.789 0 .986-.7 1.789-1.597 1.789z" fill="#5865F2"/>
              </svg>
              Discord
            </button>
            <button
              onClick={() => startTransition(async () => { await signInWithGoogle() })}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 h-11 bg-surface border border-[rgba(232,184,75,0.20)] rounded hover:bg-surface2 hover:border-[rgba(232,184,75,0.35)] transition-all text-sm font-medium disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M15.68 8.18c0-.57-.051-1.117-.146-1.645H8v3.11h4.305a3.68 3.68 0 01-1.597 2.417v2.01h2.586c1.512-1.393 2.386-3.445 2.386-5.892z" fill="#4285F4"/>
                <path d="M8 16c2.16 0 3.97-.716 5.293-1.937l-2.586-2.011c-.716.48-1.632.763-2.707.763-2.082 0-3.845-1.406-4.474-3.295H.855v2.077A7.998 7.998 0 008 16z" fill="#34A853"/>
                <path d="M3.526 9.52A4.81 4.81 0 013.274 8c0-.526.091-1.036.252-1.52V4.403H.855A8.001 8.001 0 000 8c0 1.292.309 2.515.855 3.597l2.671-2.077z" fill="#FBBC05"/>
                <path d="M8 3.184c1.173 0 2.226.403 3.054 1.196l2.29-2.29C11.965.791 10.155 0 8 0A7.998 7.998 0 00.855 4.403L3.526 6.48C4.155 4.59 5.918 3.184 8 3.184z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[rgba(232,184,75,0.15)]" />
            <span className="font-pixel text-[6px] text-text-3 tracking-wider">or continue with email</span>
            <div className="flex-1 h-px bg-[rgba(232,184,75,0.15)]" />
          </div>

          {/* Error / Success banners */}
          {error && (
            <div className="mb-4 p-3 rounded bg-[rgba(232,85,85,0.1)] border border-[rgba(232,85,85,0.2)] text-red text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded bg-[rgba(62,207,116,0.1)] border border-[rgba(62,207,116,0.2)] text-green text-sm">
              {success}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">Welcome back.</h1>
                <p className="text-text-2 text-sm font-light">Sign in to your event dashboard.</p>
              </div>
              <Input
                name="email" type="email" label="Email address"
                placeholder="you@example.com" autoComplete="email" required
              />
              <Input
                name="password" type="password" label="Password"
                placeholder="Enter your password" autoComplete="current-password" required
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-text-2 cursor-pointer">
                  <input type="checkbox" name="remember" defaultChecked className="accent-gold" />
                  Stay signed in
                </label>
                <button type="button" className="text-sm text-gold-dim hover:text-gold transition-colors">
                  Forgot password?
                </button>
              </div>
              <Button type="submit" size="lg" loading={isPending} className="w-full">
                Sign in →
              </Button>
              <p className="text-center text-sm text-text-2">
                No account?{' '}
                <button type="button" onClick={() => switchTab('register')} className="text-gold hover:text-[#f0c85a] font-medium">
                  Create one free →
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">Join TileScape.</h1>
                <p className="text-text-2 text-sm font-light">Set up your account in seconds.</p>
              </div>
              <Input
                name="display_name" type="text" label="RuneScape Name (RSN)"
                placeholder="e.g. Zezima" autoComplete="username"
                maxLength={12} hint="Max 12 characters · Your in-game display name" required
              />
              <Input
                name="email" type="email" label="Email address"
                placeholder="you@example.com" autoComplete="email" required
              />
              <Input
                name="password" type="password" label="Password"
                placeholder="Create a strong password"
                autoComplete="new-password" required minLength={8}
              />
              <label className="flex items-start gap-2 text-sm text-text-2 cursor-pointer">
                <input type="checkbox" name="terms" required className="accent-gold mt-0.5 flex-shrink-0" />
                <span>
                  I agree to the{' '}
                  <a href="#" className="text-gold hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-gold hover:underline">Privacy Policy</a>
                </span>
              </label>
              <Button type="submit" size="lg" loading={isPending} className="w-full">
                Create Account →
              </Button>
              <p className="text-center text-sm text-text-2">
                Already have an account?{' '}
                <button type="button" onClick={() => switchTab('login')} className="text-gold hover:text-[#f0c85a] font-medium">
                  Sign in →
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="absolute bottom-6 font-pixel text-[6px] text-text-3 tracking-wide">
          © 2025 TileScape · Not affiliated with Jagex
        </p>
      </div>
    </div>
  )
}
