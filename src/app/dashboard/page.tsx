import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createEvent, joinEvent } from '@/app/actions/events'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Event, EventMember } from '@/types/database'

type EventWithRole = Event & { event_members: Pick<EventMember, 'role'>[] }

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Events the user belongs to
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      event_members!inner(role)
    `)
    .eq('event_members.user_id', user.id)
    .order('created_at', { ascending: false }) as { data: EventWithRole[] | null }

  const myEvents = events?.filter(e => e.event_members[0]?.role === 'owner') ?? []
  const joinedEvents = events?.filter(e => e.event_members[0]?.role !== 'owner') ?? []

  return (
    <div className="min-h-screen bg-bg">

      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-bg2 border-b border-[rgba(232,184,75,0.20)] px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-syne font-extrabold text-lg tracking-tight">
          Tile<span className="text-gold">Scape</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-2">{profile?.display_name}</span>
          <Link href="/account" className="text-xs text-text-3 hover:text-text-2 transition-colors">Settings</Link>
          <form action={signOut}>
            <button type="submit" className="text-xs text-text-3 hover:text-text-2 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-1">
              Welcome back, <span className="text-gold">{profile?.display_name}</span>
            </h1>
            <p className="text-text-2 text-sm">Manage your events or join one with an invite code.</p>
          </div>
          <div className="flex gap-2">
            <JoinEventForm />
            <CreateEventButton />
          </div>
        </div>

        {/* My Events */}
        <section className="mb-10">
          <h2 className="font-pixel text-[8px] text-text-3 tracking-widest mb-4 uppercase">My Events</h2>
          {myEvents.length === 0 ? (
            <EmptyState
              title="No events yet"
              description="Create your first bingo event to get started."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEvents.map(event => (
                <EventCard key={event.id} event={event} role="owner" />
              ))}
            </div>
          )}
        </section>

        {/* Joined Events */}
        {joinedEvents.length > 0 && (
          <section>
            <h2 className="font-pixel text-[8px] text-text-3 tracking-widest mb-4 uppercase">Joined Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedEvents.map(event => (
                <EventCard key={event.id} event={event} role={event.event_members[0]?.role as any} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function EventCard({ event, role }: { event: EventWithRole; role: string }) {
  const now = new Date()
  const end = event.end_date ? new Date(event.end_date) : null
  const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / 86400000) : null

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <Card hover className="h-full">
        <CardBody className="p-5">
          <div className="flex items-start justify-between mb-3">
            <StatusBadge status={event.status} />
            {role === 'owner' && (
              <span className="font-pixel text-[6px] text-gold-dim">OWNER</span>
            )}
            {role === 'moderator' && (
              <span className="font-pixel text-[6px] text-[#4b9ef0]">MOD</span>
            )}
          </div>
          <h3 className="font-syne font-bold text-base tracking-tight mb-1 group-hover:text-gold transition-colors">
            {event.name}
          </h3>
          {event.description && (
            <p className="text-text-2 text-xs leading-relaxed mb-3 line-clamp-2">{event.description}</p>
          )}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[rgba(232,184,75,0.08)]">
            <span className="font-pixel text-[6px] text-text-3">
              {event.invite_code}
            </span>
            {daysLeft !== null && event.status === 'live' && (
              <span className={`font-pixel text-[6px] ${daysLeft <= 1 ? 'text-red' : daysLeft <= 3 ? 'text-gold' : 'text-text-3'}`}>
                {daysLeft <= 0 ? 'ENDING TODAY' : `${daysLeft}D LEFT`}
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-dashed border-[rgba(232,184,75,0.15)] rounded-lg p-10 text-center">
      <p className="font-syne font-bold text-text-2 mb-1">{title}</p>
      <p className="text-sm text-text-3">{description}</p>
    </div>
  )
}

function CreateEventButton() {
  return (
    <form action={async () => {
      'use server'
      // Opens modal client-side — this is a placeholder
    }}>
      <Link href="/events/new">
        <Button size="sm" variant="primary">
          + Create Event
        </Button>
      </Link>
    </form>
  )
}

function JoinEventForm() {
  return (
    <form action={async (formData: FormData) => {
      'use server'
      const code = formData.get('code') as string
      if (code) await joinEvent(code)
    }} className="flex gap-2">
      <input
        name="code"
        placeholder="Invite code"
        className="h-9 px-3 text-sm bg-surface border border-[rgba(232,184,75,0.20)] rounded text-text placeholder:text-text-3 outline-none focus:border-gold-dim w-28 uppercase"
        maxLength={8}
      />
      <Button type="submit" variant="ghost" size="sm">Join</Button>
    </form>
  )
}
