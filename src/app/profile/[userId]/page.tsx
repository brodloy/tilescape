import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { AppNav } from '@/components/ui/AppNav'

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user: me } } = await supabase.auth.getUser()
  if (!me) redirect('/login')

  const { data: profile } = await db
    .from('users').select('id, display_name, avatar_url, created_at').eq('id', params.userId).single()
  if (!profile) notFound()

  const { data: myProfile } = await db
    .from('users').select('display_name, avatar_url').eq('id', me.id).single()

  const { data: completions } = await db
    .from('tile_completions')
    .select('id, submitted_at, tiles(id, name, sprite_url, events(id, name, status)), teams(id, name, color)')
    .eq('submitted_by', params.userId)
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false })

  const { data: memberships } = await db
    .from('event_members')
    .select('id, role, joined_at, events(id, name, status)')
    .eq('user_id', params.userId)
    .order('joined_at', { ascending: false })

  const drops = completions ?? []
  const events = memberships ?? []
  const eventsOwned = events.filter((m: any) => m.role === 'owner').length

  const dropsByEvent: Record<string, number> = {}
  drops.forEach((d: any) => {
    const eid = d.tiles?.events?.id
    if (eid) dropsByEvent[eid] = (dropsByEvent[eid] ?? 0) + 1
  })

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const S = {
    pill: { fontFamily: "'Press Start 2P',monospace", fontSize: '7px', letterSpacing: '0.5px' } as React.CSSProperties,
    sectionLabel: { fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#e8b84b', letterSpacing: '1px', marginBottom: '16px' } as React.CSSProperties,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans',sans-serif" }}>
      <AppNav displayName={myProfile?.display_name ?? ''} avatarUrl={myProfile?.avatar_url}
        context={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/dashboard" style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>Dashboard</Link>
            <span style={{ color: '#4a4438' }}>/</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{profile.display_name}</span>
          </div>
        }
      />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '96px 32px 80px' }}>

        {/* Hero card */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', marginBottom: '40px', padding: '32px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.12)', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #e8b84b, #3ecf74, #4b9ef0)' }} />
          <Avatar src={profile.avatar_url} name={profile.display_name} size={88} color="#e8b84b" />
          <div style={{ flex: 1 }}>
            <div style={{ ...S.pill, color: '#4a4438', marginBottom: '8px' }}>PLAYER PROFILE</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '36px', letterSpacing: '-1px', color: '#f0e8d8', marginBottom: '6px' }}>{profile.display_name}</h1>
            <div style={{ fontSize: '13px', color: '#4a4438' }}>Member since {memberSince}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            {[
              { value: drops.length, label: 'TILES', color: '#e8b84b' },
              { value: events.length, label: 'EVENTS', color: '#3ecf74' },
              { value: eventsOwned, label: 'OWNED', color: '#4b9ef0' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '16px 20px', background: 'var(--bg3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', minWidth: '80px' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '28px', color: s.color, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
                <div style={{ ...S.pill, color: '#4a4438', marginTop: '6px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

          {/* Drop history */}
          <div>
            <div style={S.sectionLabel}>DROP HISTORY</div>
            {drops.length === 0 ? (
              <div style={{ padding: '48px 32px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.08)', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '18px', color: '#9a8f7a', marginBottom: '8px' }}>No drops yet</div>
                <div style={{ fontSize: '14px', color: '#4a4438' }}>Completed tiles will appear here</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {drops.slice(0, 50).map((drop: any) => {
                  const tile = drop.tiles
                  const event = tile?.events
                  const team = drop.teams
                  return (
                    <div key={drop.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.07)', borderRadius: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg3)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {tile?.sprite_url
                          ? <img src={tile.sprite_url} alt={tile.name} style={{ width: '32px', height: '32px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                          : <span style={{ fontSize: '20px' }}>🎯</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '15px', color: '#f0e8d8', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tile?.name ?? 'Unknown tile'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {team && <><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: team.color, flexShrink: 0 }} /><span style={{ fontSize: '13px', color: '#9a8f7a' }}>{team.name}</span><span style={{ color: '#4a4438' }}>·</span></>}
                          {event && <Link href={`/events/${event.id}`} style={{ fontSize: '13px', color: '#7a5c1e', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.name}</Link>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ecf74' }} />
                          <span style={{ ...S.pill, color: '#3ecf74' }}>DONE</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#4a4438' }}>{formatTimeAgo(new Date(drop.submitted_at))}</span>
                      </div>
                    </div>
                  )
                })}
                {drops.length > 50 && (
                  <div style={{ textAlign: 'center', padding: '14px', fontSize: '13px', color: '#4a4438' }}>+ {drops.length - 50} more</div>
                )}
              </div>
            )}
          </div>

          {/* Events sidebar */}
          <div>
            <div style={S.sectionLabel}>EVENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {events.length === 0 ? (
                <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.08)', borderRadius: '12px', textAlign: 'center', color: '#4a4438', fontSize: '13px' }}>No events yet</div>
              ) : events.map((m: any) => {
                const event = m.events
                if (!event) return null
                const statusColor = event.status === 'live' ? '#3ecf74' : event.status === 'ended' ? '#4a4438' : '#9a8f7a'
                const count = dropsByEvent[event.id] ?? 0
                return (
                  <Link key={m.id} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.08)', borderRadius: '12px', transition: 'border-color .15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,184,75,0.25)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,184,75,0.08)'}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: '#f0e8d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>{event.name}</div>
                        <div style={{ ...S.pill, color: statusColor, flexShrink: 0 }}>{event.status?.toUpperCase()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {m.role !== 'member' && <span style={{ ...S.pill, color: m.role === 'owner' ? '#7a5c1e' : '#4b9ef0', padding: '2px 6px', borderRadius: '3px', background: m.role === 'owner' ? 'rgba(232,184,75,0.08)' : 'rgba(75,158,240,0.08)', border: `1px solid ${m.role === 'owner' ? 'rgba(232,184,75,0.15)' : 'rgba(75,158,240,0.2)'}` }}>{m.role.toUpperCase()}</span>}
                        {count > 0 && <span style={{ fontSize: '12px', color: '#4a4438' }}>{count} tile{count !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
