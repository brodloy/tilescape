import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { joinEventWithRedirect } from '@/app/actions/forms'
import { Button } from '@/components/ui/Button'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tilescape.vercel.app'

export async function generateMetadata({ searchParams }: { searchParams: { code?: string } }): Promise<Metadata> {
  if (!searchParams.code) return { title: 'Join Event — TileScape' }
  const supabase = await createClient()
  const db = supabase as any
  const { data: event } = await db.from('events').select('name, description, status').eq('invite_code', searchParams.code.toUpperCase()).maybeSingle()
  if (!event) return { title: 'Join Event — TileScape' }
  const title = `Join ${event.name} — TileScape`
  const description = event.description ?? `You've been invited to join "${event.name}" on TileScape — the OSRS clan bingo tracker.`
  return {
    title, description,
    openGraph: { title, description, type: 'website', url: `${APP_URL}/join?code=${searchParams.code}`, siteName: 'TileScape', images: [{ url: `${APP_URL}/api/og?code=${searchParams.code}`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function JoinPage({ searchParams }: { searchParams: { code?: string; error?: string } }) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — redirect to login preserving code
  if (!user) {
    const dest = searchParams.code
      ? `/login?redirectTo=/join?code=${searchParams.code}`
      : '/login'
    redirect(dest)
  }

  // If a valid code is present and no error, auto-join and redirect straight to the board
  if (searchParams.code && !searchParams.error) {
    const code = searchParams.code.toUpperCase()
    const { data: event } = await db.from('events').select('id, name, status').eq('invite_code', code).maybeSingle()

    if (!event) {
      // Fall through to show form with error
    } else if (event.status === 'ended') {
      // Fall through to show form with error
    } else {
      // Ensure public.users row exists for brand-new Discord users
      const { data: existingUser } = await db.from('users').select('id').eq('id', user.id).maybeSingle()
      if (!existingUser) {
        const identity = user.identities?.find((i: any) => i.provider === 'discord')
        const adminForUser = createAdminClient() as any
        await adminForUser.from('users').insert({
          id: user.id,
          email: user.email ?? '',
          display_name: identity?.identity_data?.full_name ?? identity?.identity_data?.name ?? user.email?.split('@')[0] ?? 'Adventurer',
          avatar_url: identity?.identity_data?.avatar_url ?? null,
        })
      }

      // Check if already a member
      const { data: existing } = await db.from('event_members').select('id').eq('event_id', event.id).eq('user_id', user.id).maybeSingle()
      if (!existing) {
        // Use admin client to bypass RLS for the insert
        const admin = createAdminClient() as any
        const { error: insertError } = await admin.from('event_members').insert({ event_id: event.id, user_id: user.id, role: 'member' })
        if (insertError) {
          console.error('Failed to insert event_member:', insertError)
          redirect(`/join?error=${encodeURIComponent('Failed to join event. Please try again.')}&code=${code}`)
        }
      }

      redirect(`/events/${event.id}`)
    }
  }

  // Show the manual join form (no code, invalid code, or ended event)
  let eventPreview: any = null
  const errorMessage = searchParams.error === 'invalid'
    ? 'Invalid invite code. Please check and try again.'
    : searchParams.error ?? null

  // Still try to preview even if there was an error, using the code
  if (searchParams.code && !eventPreview) {
    const { data } = await db.from('events').select('id, name, description, status, invite_code').eq('invite_code', searchParams.code.toUpperCase()).maybeSingle()
    if (data && data.status !== 'ended') eventPreview = data
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(232,184,75,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-2xl tracking-tight">Tile<span className="text-gold">Scape</span></Link>
        </div>
        <div className="bg-bg2 border border-[rgba(232,184,75,0.20)] rounded-xl overflow-hidden shadow-2xl">
          {eventPreview ? (
            <div className="p-6 border-b border-[rgba(232,184,75,0.10)]">
              <p className="font-pixel text-[9px] text-gold tracking-widest mb-3">YOU'VE BEEN INVITED TO</p>
              <h2 className="font-syne font-extrabold text-xl tracking-tight mb-1">{eventPreview.name}</h2>
              {eventPreview.description && <p className="text-text-2 text-sm leading-relaxed">{eventPreview.description}</p>}
              <div className="flex items-center gap-2 mt-3">
                <span className={`font-pixel text-[9px] px-2 py-1 rounded border ${eventPreview.status === 'live' ? 'bg-[rgba(62,207,116,0.1)] text-green border-[rgba(62,207,116,0.25)]' : 'bg-surface2 text-text-3 border-[rgba(255,255,255,0.08)]'}`}>
                  {eventPreview.status === 'live' ? '● LIVE' : eventPreview.status.toUpperCase()}
                </span>
                <span className="font-pixel text-[9px] text-text-3">CODE: {eventPreview.invite_code}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-[rgba(232,184,75,0.10)]">
              <p className="font-pixel text-[9px] text-gold tracking-widest mb-2">JOIN AN EVENT</p>
              <p className="text-text-2 text-sm">Enter an 8-character invite code to join a bingo event.</p>
            </div>
          )}
          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3 rounded bg-[rgba(232,85,85,0.1)] border border-[rgba(232,85,85,0.2)] text-red text-sm">{errorMessage}</div>
            )}
            <form action={joinEventWithRedirect}>
              <input type="hidden" name="return_code" value={searchParams.code ?? ''} />
              <div className="space-y-4">
                <div>
                  <label className="block font-pixel text-[9px] text-text-2 tracking-wider mb-2 uppercase">Invite Code</label>
                  <input name="code" defaultValue={searchParams.code ?? ''} placeholder="e.g. AB12CD34" maxLength={8}
                    className="w-full h-12 px-4 rounded bg-surface border border-[rgba(232,184,75,0.20)] text-text text-sm placeholder:text-text-3 outline-none focus:border-gold-dim uppercase tracking-widest font-pixel text-xs transition-all"
                    style={{ letterSpacing: '0.15em' }} />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  {eventPreview ? `Join ${eventPreview.name} →` : 'Join Event →'}
                </Button>
              </div>
            </form>
            <p className="text-center text-sm text-text-2 mt-4">
              Want to create your own event?{' '}
              <Link href="/events/new" className="text-gold hover:text-[#f0c85a] font-medium transition-colors">Create one →</Link>
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
