import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { joinEventAction } from '@/app/actions/forms'
import { signOut } from '@/app/actions/auth'
import { StatusBadge } from '@/components/ui/Badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('users').select('display_name, avatar_url').eq('id', user.id).single()

  const { data: memberships } = await db
    .from('event_members')
    .select('role, event_id, events(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const myEvents = (memberships ?? []).filter((m: any) => m.role === 'owner').map((m: any) => ({ ...m.events, myRole: m.role }))
  const joinedEvents = (memberships ?? []).filter((m: any) => m.role !== 'owner').map((m: any) => ({ ...m.events, myRole: m.role }))

  return (
    <div className="min-h-screen bg-bg">
      {/* Radial glow top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none" style={{background:'radial-gradient(ellipse, rgba(232,184,75,0.06) 0%, transparent 65%)'}} />

      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-[rgba(12,10,8,0.85)] backdrop-blur-md border-b border-[rgba(232,184,75,0.20)] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="grid gap-[2px]" style={{gridTemplateColumns:'repeat(3,6px)',gridTemplateRows:'repeat(3,6px)'}}>
            {[1,0,1,1,1,0,0,1,1].map((on,i) => (
              <span key={i} className="block rounded-[1px]" style={{background: on ? '#e8b84b' : 'transparent'}} />
            ))}
          </div>
          <span className="font-syne font-extrabold text-xl tracking-tight">Tile<em className="not-italic text-gold">Scape</em></span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-2 font-medium">{profile?.display_name}</span>
          <Link href="/account" className="font-pixel text-[6px] text-text-3 hover:text-gold transition-colors tracking-wider">SETTINGS</Link>
          <form action={signOut}>
            <button type="submit" className="font-pixel text-[6px] text-text-3 hover:text-text-2 transition-colors tracking-wider">SIGN OUT</button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Page header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <div className="font-pixel text-[7px] text-gold tracking-widest mb-3 opacity-80">DASHBOARD</div>
            <h1 className="font-syne font-extrabold text-4xl tracking-tight mb-2">
              Welcome back, <span className="text-gold">{profile?.display_name}</span>
            </h1>
            <p className="text-text-2 text-sm font-light">Manage your events or join one with an invite code.</p>
          </div>
          <div className="flex gap-2 items-center mt-1">
            <form action={joinEventAction} className="flex gap-2">
              <input
                name="code"
                placeholder="Invite code"
                className="h-10 px-3 text-sm bg-surface border border-[rgba(232,184,75,0.20)] rounded text-text placeholder:text-text-3 outline-none focus:border-gold-dim focus:shadow-[0_0_0_3px_rgba(232,184,75,0.08)] w-32 uppercase tracking-widest font-pixel text-[10px] transition-all"
                maxLength={8}
              />
              <button type="submit" className="h-10 px-4 text-sm font-syne font-bold border border-[rgba(232,184,75,0.20)] rounded text-text-2 hover:text-text hover:border-gold-dim hover:bg-surface transition-all">
                Join
              </button>
            </form>
            <Link href="/events/new" className="h-10 px-4 inline-flex items-center font-syne font-bold text-sm bg-gold text-bg rounded hover:bg-[#f0c85a] transition-all shadow-[0_0_20px_rgba(232,184,75,0.2)] hover:shadow-[0_0_32px_rgba(232,184,75,0.35)]">
              + Create Event
            </Link>
          </div>
        </div>

        {/* My Events */}
        <section className="mb-12">
          <div className="font-pixel text-[7px] text-text-3 tracking-widest mb-5 uppercase">My Events</div>
          {myEvents.length === 0 ? (
            <div className="border border-dashed border-[rgba(232,184,75,0.15)] rounded-xl p-12 text-center">
              <div className="font-pixel text-[8px] text-gold-dim mb-3 tracking-wider">NO EVENTS YET</div>
              <p className="text-text-2 text-sm font-light mb-6">Create your first bingo event to get started.</p>
              <Link href="/events/new" className="inline-flex items-center px-5 py-2.5 font-syne font-bold text-sm bg-gold text-bg rounded hover:bg-[#f0c85a] transition-all">
                + Create Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEvents.map((event: any) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </section>

        {/* Joined Events */}
        {joinedEvents.length > 0 && (
          <section>
            <div className="font-pixel text-[7px] text-text-3 tracking-widest mb-5 uppercase">Joined Events</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedEvents.map((event: any) => <EventCard key={event.id} event={event} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function EventCard({ event }: { event: any }) {
  const now = new Date()
  const end = event.end_date ? new Date(event.end_date) : null
  const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / 86400000) : null

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div className="bg-surface border border-[rgba(232,184,75,0.10)] rounded-xl p-5 h-full transition-all duration-150 hover:border-[rgba(232,184,75,0.25)] hover:bg-surface2 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between mb-3">
          <StatusBadge status={event.status} />
          {event.myRole === 'owner' && <span className="font-pixel text-[6px] text-gold-dim">OWNER</span>}
          {event.myRole === 'moderator' && <span className="font-pixel text-[6px] text-[#4b9ef0]">MOD</span>}
        </div>
        <h3 className="font-syne font-bold text-base tracking-tight mb-1 group-hover:text-gold transition-colors leading-tight">
          {event.name}
        </h3>
        {event.description && (
          <p className="text-text-2 text-xs leading-relaxed mb-3 line-clamp-2 font-light">{event.description}</p>
        )}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(232,184,75,0.08)]">
          <span className="font-pixel text-[6px] text-text-3 tracking-wider">{event.invite_code}</span>
          {daysLeft !== null && event.status === 'live' && (
            <span className={`font-pixel text-[6px] ${daysLeft <= 1 ? 'text-red' : daysLeft <= 3 ? 'text-gold' : 'text-text-3'}`}>
              {daysLeft <= 0 ? 'ENDING TODAY' : `${daysLeft}D LEFT`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
