import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { joinEventAction } from '@/app/actions/forms'
import { UserMenu } from '@/components/ui/UserMenu'
import { CopyButton } from '@/components/ui/CopyButton'
import { EventCard } from '@/components/ui/EventCard'

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

  const allEvents = (memberships ?? []).map((m: any) => ({ ...m.events, myRole: m.role }))
  const myEvents = allEvents.filter((e: any) => e.myRole === 'owner')
  const joinedEvents = allEvents.filter((e: any) => e.myRole !== 'owner')

  // For each event get tile stats
  const eventIds = allEvents.map((e: any) => e.id).filter(Boolean)
  let tileStats: Record<string, { total: number; done: number; teams: number; purples: number }> = {}
  if (eventIds.length > 0) {
    const { data: tiles } = await db
      .from('tiles')
      .select('event_id, free_space, is_purple, tile_completions(status)')
      .in('event_id', eventIds)
    const { data: teams } = await db
      .from('teams')
      .select('event_id, color')
      .in('event_id', eventIds)

    eventIds.forEach((id: string) => {
      const evTiles = (tiles ?? []).filter((t: any) => t.event_id === id && !t.free_space)
      const done = evTiles.filter((t: any) => t.tile_completions?.some((c: any) => c.status === 'approved'))
      const purples = done.filter((t: any) => t.is_purple)
      const evTeams = (teams ?? []).filter((t: any) => t.event_id === id)
      tileStats[id] = { total: evTiles.length, done: done.length, purples: purples.length, teams: evTeams.length }
    })
  }

  const displayName = profile?.display_name ?? 'Adventurer'
  const liveEvents = allEvents.filter((e: any) => e.status === 'live')

  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Radial glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: '900px', height: '500px', background: 'radial-gradient(ellipse, rgba(232,184,75,0.07) 0%, transparent 65%)' }} />
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(232,184,75,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(232,184,75,0.025) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'linear-gradient(to bottom, black 0%, transparent 40%)' }} />

      {/* ── NAV ── matches public pages exactly */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '64px',
        background: 'rgba(12,10,8,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(232,184,75,0.12)',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,6px)', gridTemplateRows: 'repeat(3,6px)', gap: '2px' }}>
            {[1,0,1,1,1,0,0,1,1].map((on, i) => (
              <span key={i} style={{ display: 'block', background: on ? '#e8b84b' : 'transparent', borderRadius: '1px' }} />
            ))}
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Tile<em style={{ color: '#e8b84b', fontStyle: 'normal' }}>Scape</em>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/dashboard" style={{ fontSize: '14px', color: '#e8b84b', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
          <Link href="/events/new" style={{ fontSize: '14px', color: '#9a8f7a', textDecoration: 'none', transition: 'color .2s' }}
            onMouseEnter={undefined}>New Event</Link>
        </div>

        {/* User menu */}
        <UserMenu displayName={displayName} />
      </nav>

      <main style={{ paddingTop: '64px', position: 'relative', zIndex: 10 }}>

        {/* ── HERO HEADER ── inspired by landing page hero */}
        <div style={{
          padding: '64px 48px 48px',
          borderBottom: '1px solid rgba(232,184,75,0.08)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.22)',
                  borderRadius: '999px', padding: '5px 14px', marginBottom: '20px',
                }}>
                  <div style={{ width: '6px', height: '6px', background: '#3ecf74', borderRadius: '50%', boxShadow: '0 0 6px #3ecf74' }} />
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#e8b84b', letterSpacing: '1px' }}>
                    {liveEvents.length > 0 ? `${liveEvents.length} EVENT${liveEvents.length > 1 ? 'S' : ''} LIVE` : 'DASHBOARD'}
                  </span>
                </div>
                <h1 style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  fontSize: 'clamp(36px, 5vw, 64px)',
                  letterSpacing: '-2px', lineHeight: 0.95,
                  color: '#f0e8d8', marginBottom: '16px',
                }}>
                  Welcome back,<br />
                  <span style={{ color: '#e8b84b' }}>{displayName}</span>
                </h1>
                <p style={{ fontSize: '16px', color: '#9a8f7a', fontWeight: 300, maxWidth: '480px' }}>
                  {allEvents.length === 0
                    ? 'Create your first event or join one with an invite code.'
                    : `You have ${allEvents.length} event${allEvents.length > 1 ? 's' : ''} — ${liveEvents.length} currently live.`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                <form action={joinEventAction} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    name="code"
                    placeholder="INVITE CODE"
                    maxLength={8}
                    style={{
                      height: '44px', padding: '0 14px',
                      background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.20)',
                      borderRadius: '6px', color: 'var(--text)',
                      fontFamily: "'Press Start 2P', monospace", fontSize: '9px',
                      letterSpacing: '2px', width: '160px', outline: 'none',
                    }}
                  />
                  <button type="submit" style={{
                    height: '44px', padding: '0 18px',
                    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px',
                    background: 'none', border: '1px solid rgba(232,184,75,0.22)',
                    borderRadius: '6px', color: '#9a8f7a', cursor: 'pointer', transition: 'all .2s',
                  }}>
                    Join
                  </button>
                </form>
                <Link href="/events/new" style={{
                  height: '44px', padding: '0 22px',
                  display: 'inline-flex', alignItems: 'center',
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px',
                  background: '#e8b84b', color: '#0c0a08',
                  borderRadius: '6px', textDecoration: 'none',
                  boxShadow: '0 0 32px rgba(232,184,75,0.25)',
                  transition: 'all .2s',
                }}>
                  + Create Event
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── INVITE CODES BANNER ── full width, for live events */}
        {liveEvents.length > 0 && (
          <div style={{
            background: 'rgba(232,184,75,0.04)',
            borderBottom: '1px solid rgba(232,184,75,0.10)',
            padding: '0 48px',
          }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 0' }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: '#4a4438', letterSpacing: '2px', marginBottom: '14px' }}>
                LIVE EVENT CODES — SHARE WITH YOUR CLAN
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {liveEvents.map((event: any) => (
                  <div key={event.id} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.18)',
                    borderRadius: '10px', padding: '14px 20px',
                    flex: '1', minWidth: '280px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: '#4a4438', letterSpacing: '1px', marginBottom: '6px' }}>
                        {event.name}
                      </div>
                      <div style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '20px', color: '#e8b84b',
                        letterSpacing: '6px', lineHeight: 1,
                      }}>
                        {event.invite_code}
                      </div>
                    </div>
                    <CopyButton text={`Join my TileScape bingo at tilescape.vercel.app/join?code=${event.invite_code} — Code: ${event.invite_code}`} label="COPY LINK" />
                    <Link href={`/events/${event.id}`} style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: '7px',
                      padding: '8px 14px', borderRadius: '6px',
                      background: 'rgba(232,184,75,0.1)', border: '1px solid rgba(232,184,75,0.25)',
                      color: '#e8b84b', textDecoration: 'none',
                      whiteSpace: 'nowrap', letterSpacing: '0.5px',
                    }}>
                      VIEW →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EVENTS GRID ── */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 48px 80px' }}>

          {allEvents.length === 0 ? (
            <div style={{
              border: '1px dashed rgba(232,184,75,0.15)', borderRadius: '16px',
              padding: '80px 40px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#7a5c1e', marginBottom: '16px', letterSpacing: '1px' }}>NO EVENTS YET</div>
              <p style={{ color: '#9a8f7a', fontSize: '15px', fontWeight: 300, marginBottom: '28px' }}>Create your first bingo event to get started.</p>
              <Link href="/events/new" style={{
                display: 'inline-flex', alignItems: 'center', padding: '14px 32px',
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '15px',
                background: '#e8b84b', color: '#0c0a08', borderRadius: '6px',
                textDecoration: 'none', boxShadow: '0 0 32px rgba(232,184,75,0.25)',
              }}>
                Create Your First Event →
              </Link>
            </div>
          ) : (
            <>
              {myEvents.length > 0 && (
                <section style={{ marginBottom: '48px' }}>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#4a4438', letterSpacing: '2px', marginBottom: '20px' }}>MY EVENTS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {myEvents.map((event: any) => <EventCard key={event.id} event={event} stats={tileStats[event.id]} />)}
                  </div>
                </section>
              )}
              {joinedEvents.length > 0 && (
                <section>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#4a4438', letterSpacing: '2px', marginBottom: '20px' }}>JOINED EVENTS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {joinedEvents.map((event: any) => <EventCard key={event.id} event={event} stats={tileStats[event.id]} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
