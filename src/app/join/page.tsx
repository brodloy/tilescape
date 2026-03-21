import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { joinEvent } from '@/app/actions/events'
import { Button } from '@/components/ui/Button'

export default async function JoinPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string }
}) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const dest = searchParams.code
      ? `/login?redirectTo=/join?code=${searchParams.code}`
      : '/login'
    redirect(dest)
  }

  // If a code was passed in the URL, look up the event to show a preview
  let eventPreview: any = null
  if (searchParams.code) {
    const { data } = await db
      .from('events')
      .select('id, name, description, status, invite_code, created_at')
      .eq('invite_code', searchParams.code.toUpperCase())
      .single()
    eventPreview = data
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'linear-gradient(rgba(232,184,75,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-2xl tracking-tight">
            Tile<span className="text-gold">Scape</span>
          </Link>
        </div>

        <div className="bg-bg2 border border-[rgba(232,184,75,0.20)] rounded-xl overflow-hidden shadow-2xl">

          {/* Event preview */}
          {eventPreview ? (
            <div className="p-6 border-b border-[rgba(232,184,75,0.10)]">
              <p className="font-pixel text-[6px] text-gold tracking-widest mb-3">YOU'VE BEEN INVITED TO</p>
              <h2 className="font-syne font-extrabold text-xl tracking-tight mb-1">{eventPreview.name}</h2>
              {eventPreview.description && (
                <p className="text-text-2 text-sm leading-relaxed">{eventPreview.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span className={`font-pixel text-[6px] px-2 py-1 rounded border ${
                  eventPreview.status === 'live'
                    ? 'bg-[rgba(62,207,116,0.1)] text-green border-[rgba(62,207,116,0.25)]'
                    : eventPreview.status === 'draft'
                    ? 'bg-surface2 text-text-3 border-[rgba(255,255,255,0.08)]'
                    : 'bg-surface2 text-text-3 border-[rgba(255,255,255,0.08)]'
                }`}>
                  {eventPreview.status === 'live' ? '● LIVE' : eventPreview.status.toUpperCase()}
                </span>
                <span className="font-pixel text-[6px] text-text-3">
                  CODE: {eventPreview.invite_code}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-[rgba(232,184,75,0.10)]">
              <p className="font-pixel text-[6px] text-gold tracking-widest mb-2">JOIN AN EVENT</p>
              <p className="text-text-2 text-sm">Enter an 8-character invite code to join a bingo event.</p>
            </div>
          )}

          {/* Join form */}
          <div className="p-6">
            {searchParams.error && (
              <div className="mb-4 p-3 rounded bg-[rgba(232,85,85,0.1)] border border-[rgba(232,85,85,0.2)] text-red text-sm">
                {searchParams.error === 'invalid' ? 'Invalid invite code. Please check and try again.' : searchParams.error}
              </div>
            )}

            <form action={async (formData: FormData) => {
              'use server'
              const code = formData.get('code') as string
              if (!code?.trim()) return
              const result = await joinEvent(code.trim())
              if (result?.error) {
                redirect(`/join?error=${encodeURIComponent(result.error)}${searchParams.code ? `&code=${searchParams.code}` : ''}`)
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">
                    Invite Code
                  </label>
                  <input
                    name="code"
                    defaultValue={searchParams.code ?? ''}
                    placeholder="e.g. AB12CD34"
                    maxLength={8}
                    className="w-full h-12 px-4 rounded bg-surface border border-[rgba(232,184,75,0.20)] text-text text-sm placeholder:text-text-3 outline-none focus:border-gold-dim uppercase tracking-widest font-pixel text-xs transition-all"
                    style={{ letterSpacing: '0.15em' }}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  {eventPreview ? `Join ${eventPreview.name} →` : 'Join Event →'}
                </Button>
              </div>
            </form>

            <p className="text-center text-sm text-text-2 mt-4">
              Want to create your own event?{' '}
              <Link href="/events/new" className="text-gold hover:text-[#f0c85a] font-medium transition-colors">
                Create one →
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-text-3">
          <Link href="/dashboard" className="hover:text-text-2 transition-colors">← Back to Dashboard</Link>
        </p>
      </div>
    </div>
  )
}
