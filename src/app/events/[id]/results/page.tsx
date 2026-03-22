import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/ui/AppNav'
import { Avatar } from '@/components/ui/Avatar'

function formatGP(gp: number): string {
  if (gp >= 1_000_000_000) return `${(gp / 1_000_000_000).toFixed(1)}B`
  if (gp >= 1_000_000) return `${(gp / 1_000_000).toFixed(1)}M`
  if (gp >= 1_000) return `${Math.round(gp / 1_000)}K`
  return gp.toLocaleString()
}

const MEDAL = ['🥇', '🥈', '🥉']
const COINS = 'https://oldschool.runescape.wiki/w/Special:FilePath/Coins_10000.png?action=raw'

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await db.from('users').select('display_name, avatar_url').eq('id', user.id).single()

  const { data: event } = await db.from('events').select('*').eq('id', params.id).single()
  if (!event) notFound()

  const { data: membership } = await db.from('event_members').select('role').eq('event_id', params.id).eq('user_id', user.id).single()
  if (!membership) redirect(`/events/${params.id}`)

  const { data: tiles } = await db.from('tiles').select('id, name, sprite_url, position').eq('event_id', params.id).order('position')

  const { data: teams } = await db.from('teams').select('id, name, color').eq('event_id', params.id)

  const { data: completions } = await db.from('tile_completions')
    .select('id, tile_id, team_id, submitted_by, submitted_at, users!submitted_by(id, display_name, avatar_url)')
    .in('tile_id', (tiles ?? []).map((t: any) => t.id))
    .eq('status', 'approved')

  const totalTiles = (tiles ?? []).length

  // Team scores
  const teamScores = (teams ?? []).map((team: any) => {
    const done = (completions ?? []).filter((c: any) => c.team_id === team.id).length
    return { ...team, done, pct: totalTiles > 0 ? Math.round(done / totalTiles * 100) : 0 }
  }).sort((a: any, b: any) => b.done - a.done)

  // MVP — most tiles submitted
  const submitterMap: Record<string, { user: any; count: number; teamId: string }> = {}
  for (const c of completions ?? []) {
    const uid = c.submitted_by
    if (!submitterMap[uid]) submitterMap[uid] = { user: c.users, count: 0, teamId: c.team_id }
    submitterMap[uid].count++
  }
  const mvp = Object.values(submitterMap).sort((a, b) => b.count - a.count)[0]
  const mvpTeam = mvp ? teams?.find((t: any) => t.id === mvp.teamId) : null

  // Completed tiles with who got them
  const completedTiles = (tiles ?? []).filter((t: any) =>
    (completions ?? []).some((c: any) => c.tile_id === t.id)
  )

  const navContext = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Link href={`/events/${params.id}`} style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>Board</Link>
      <span style={{ color: '#4a4438' }}>/</span>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>Results</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans',sans-serif" }}>
      <AppNav displayName={myProfile?.display_name ?? ''} avatarUrl={myProfile?.avatar_url} context={navContext} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '96px 32px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#e8b84b', letterSpacing: '2px', marginBottom: '16px' }}>
            {event.status === 'ended' ? 'EVENT COMPLETE' : 'CURRENT STANDINGS'}
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '42px', letterSpacing: '-1.5px', color: '#f0e8d8', marginBottom: '12px' }}>
            {event.name}
          </h1>
          {event.prize_pool > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: 'rgba(232,184,75,0.06)', border: '1px solid rgba(232,184,75,0.2)', borderRadius: '12px' }}>
              <img src={COINS} alt="GP" style={{ width: '24px', height: '24px', imageRendering: 'pixelated' }} />
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '22px', color: '#e8b84b', letterSpacing: '-0.5px' }}>{formatGP(event.prize_pool)}</span>
              <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#7a5c1e' }}>PRIZE POOL</span>
            </div>
          )}
        </div>

        {/* Podium */}
        {teamScores.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#4a4438', letterSpacing: '1px', marginBottom: '20px' }}>TEAM STANDINGS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teamScores.map((team: any, i: number) => (
                <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 22px', background: i === 0 ? 'rgba(232,184,75,0.06)' : 'var(--surface)', border: `1px solid ${i === 0 ? 'rgba(232,184,75,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
                  {i === 0 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#e8b84b' }} />}
                  <div style={{ fontSize: '28px', flexShrink: 0, width: '40px', textAlign: 'center' }}>{MEDAL[i] ?? `#${i + 1}`}</div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: team.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '18px', color: '#f0e8d8', marginBottom: '6px' }}>{team.name}</div>
                    <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${team.pct}%`, background: team.color, borderRadius: '3px', transition: 'width 1s' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '28px', color: team.color, letterSpacing: '-1px', lineHeight: 1 }}>{team.done}</div>
                    <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: '#4a4438', marginTop: '4px' }}>/ {totalTiles} TILES</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
          {/* MVP */}
          {mvp && (
            <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.12)', borderRadius: '16px' }}>
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#e8b84b', letterSpacing: '1px', marginBottom: '16px' }}>⭐ MVP</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar src={mvp.user?.avatar_url} name={mvp.user?.display_name ?? '?'} size={52} color={mvpTeam?.color ?? '#e8b84b'} />
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '20px', color: '#f0e8d8', marginBottom: '4px' }}>{mvp.user?.display_name}</div>
                  <div style={{ fontSize: '13px', color: '#9a8f7a' }}>{mvp.count} tile{mvp.count !== 1 ? 's' : ''} completed</div>
                  {mvpTeam && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: mvpTeam.color }} />
                      <span style={{ fontSize: '13px', color: '#9a8f7a' }}>{mvpTeam.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.12)', borderRadius: '16px' }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#4a4438', letterSpacing: '1px', marginBottom: '16px' }}>EVENT STATS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Tiles completed', value: (completions ?? []).length, color: '#3ecf74' },
                { label: 'Total tiles', value: totalTiles, color: '#9a8f7a' },
                { label: 'Teams', value: (teams ?? []).length, color: '#4b9ef0' },
                { label: 'Completion', value: `${totalTiles > 0 ? Math.round((completions ?? []).length / totalTiles / Math.max((teams ?? []).length, 1) * 100) : 0}%`, color: '#e8b84b' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#9a8f7a' }}>{s.label}</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '18px', color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Completed tiles grid */}
        {completedTiles.length > 0 && (
          <div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#4a4438', letterSpacing: '1px', marginBottom: '16px' }}>
              COMPLETED TILES ({completedTiles.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
              {completedTiles.map((tile: any) => {
                const tileCompletions = (completions ?? []).filter((c: any) => c.tile_id === tile.id)
                const completingTeams = tileCompletions.map((c: any) => teams?.find((t: any) => t.id === c.team_id)).filter(Boolean)
                return (
                  <div key={tile.id} style={{ padding: '10px 6px 8px', background: 'rgba(62,207,116,0.08)', border: '1px solid rgba(62,207,116,0.2)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', position: 'relative' }}>
                    {tile.sprite_url && (
                      <img src={tile.sprite_url} alt={tile.name} style={{ width: '44px', height: '44px', objectFit: 'contain', imageRendering: 'pixelated', filter: 'brightness(1.1)' }} />
                    )}
                    <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#3ecf74', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                      {tile.name}
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {completingTeams.slice(0, 3).map((t: any) => (
                        <div key={t.id} style={{ width: '6px', height: '6px', borderRadius: '1px', background: t.color }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '48px' }}>
          <Link href={`/events/${params.id}`} style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', padding: '12px 24px', borderRadius: '10px', background: 'none', border: '1px solid rgba(232,184,75,0.2)', color: '#9a8f7a', textDecoration: 'none' }}>
            ← Back to Board
          </Link>
          <Link href="/dashboard" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', padding: '12px 24px', borderRadius: '10px', background: '#e8b84b', color: '#0c0a08', textDecoration: 'none' }}>
            Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
