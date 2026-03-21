import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { updateEventStatus } from '@/app/actions/events'
import { RealtimeBoard } from '@/components/event/RealtimeBoard'
import { MemberList } from '@/components/event/MemberList'
import { SubmissionsPanel } from '@/components/event/SubmissionsPanel'
import { EventHeader } from '@/components/event/EventHeader'

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await db
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) notFound()

  const { data: membership } = await db
    .from('event_members')
    .select('id, role')
    .eq('event_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect(`/join?code=${event.invite_code}`)

  const isOwnerOrMod = ['owner', 'moderator'].includes(membership.role)

  const { data: tiles } = await db
    .from('tiles')
    .select(`*, tile_completions(id, status, proof_url, submitted_at, team_id, users!submitted_by(display_name))`)
    .eq('event_id', params.id)
    .order('position')

  const { data: teams } = await db
    .from('teams')
    .select(`*, team_members(id, event_members(id, role, users(id, display_name, avatar_url)))`)
    .eq('event_id', params.id)
    .order('created_at')

  const { data: members } = await db
    .from('event_members')
    .select('id, role, joined_at, users(id, display_name, avatar_url)')
    .eq('event_id', params.id)
    .order('joined_at')

  let pendingSubmissions: any[] = []
  if (isOwnerOrMod) {
    const tileIds = (tiles ?? []).map((t: any) => t.id)
    if (tileIds.length > 0) {
      const { data } = await db
        .from('tile_completions')
        .select(`id, proof_url, status, submitted_at, tiles(name, is_purple, source_raid), teams(name, color), users!submitted_by(display_name)`)
        .eq('status', 'pending')
        .in('tile_id', tileIds)
        .order('submitted_at', { ascending: false })
      pendingSubmissions = data ?? []
    }
  }

  // Find current user's team
  const userMemberRecord = (members ?? []).find((m: any) => m.users?.id === user.id)
  const userTeam = (teams ?? []).find((t: any) =>
    t.team_members?.some((tm: any) => tm.event_members?.id === userMemberRecord?.id)
  )

  const nonFreeTiles = (tiles ?? []).filter((t: any) => !t.free_space)
  const approvedTiles = nonFreeTiles.filter((t: any) =>
    t.tile_completions?.some((c: any) => c.status === 'approved')
  )

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <EventHeader
        event={event}
        membership={membership}
        userId={user.id}
        pendingCount={pendingSubmissions.length}
      />

      <div className="flex-1 grid overflow-hidden" style={{
        gridTemplateColumns: '220px 1fr 260px',
        height: 'calc(100vh - 48px)',
      }}>

        {/* ── Sidebar ── */}
        <aside className="bg-bg2 border-r border-[rgba(232,184,75,0.10)] overflow-y-auto flex flex-col">
          <div className="p-3 border-b border-[rgba(232,184,75,0.10)]">
            <Link href="/dashboard" className="text-xs text-text-2 hover:text-text transition-colors">
              ← Dashboard
            </Link>
          </div>

          {/* Invite code */}
          <div className="p-4 border-b border-[rgba(232,184,75,0.10)]">
            <p className="font-pixel text-[6px] text-text-3 tracking-widest mb-2">INVITE CODE</p>
            <span className="font-pixel text-sm text-gold tracking-wider">{event.invite_code}</span>
          </div>

          {/* Teams */}
          <div className="p-4 flex-1">
            <p className="font-pixel text-[6px] text-text-3 tracking-widest mb-3">TEAMS</p>
            <div className="space-y-2">
              {(teams ?? []).map((team: any) => (
                <div key={team.id} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: team.color }} />
                  <span className="font-syne font-bold text-xs text-text flex-1">{team.name}</span>
                  <span className="font-pixel text-[6px] text-text-3">{team.team_members?.length ?? 0}</span>
                </div>
              ))}
              {isOwnerOrMod && (
                <Link href={`/events/${params.id}/manage`}>
                  <button className="w-full mt-2 text-xs text-text-3 hover:text-gold border border-dashed border-[rgba(232,184,75,0.15)] rounded py-2 transition-colors">
                    + Manage teams & tiles
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Status control */}
          {isOwnerOrMod && (
            <div className="p-4 border-t border-[rgba(232,184,75,0.10)]">
              <p className="font-pixel text-[6px] text-text-3 tracking-widest mb-3">EVENT STATUS</p>
              <StatusBadge status={event.status} />
              {event.status === 'draft' && (
                <form action={async () => {
                  'use server'
                  await updateEventStatus(params.id, 'live')
                }} className="mt-2">
                  <Button type="submit" size="sm" variant="primary" className="w-full text-xs">
                    Go Live
                  </Button>
                </form>
              )}
              {event.status === 'live' && (
                <form action={async () => {
                  'use server'
                  await updateEventStatus(params.id, 'ended')
                }} className="mt-2">
                  <Button type="submit" size="sm" variant="ghost" className="w-full text-xs">
                    End Event
                  </Button>
                </form>
              )}
            </div>
          )}
        </aside>

        {/* ── Main board ── */}
        <main className="overflow-y-auto bg-bg flex flex-col" style={{
          backgroundImage: 'linear-gradient(rgba(232,184,75,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(232,184,75,0.015) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}>
          <div className="p-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-syne font-extrabold text-xl tracking-tight">{event.name}</h2>
              {event.end_date && <CountdownBadge endDate={event.end_date} />}
            </div>
            <p className="text-text-2 text-xs">
              {approvedTiles.length} of {nonFreeTiles.length} tiles completed
            </p>
          </div>

          <RealtimeBoard
            initialTiles={tiles ?? []}
            teams={teams ?? []}
            userTeamId={userTeam?.id ?? null}
            eventId={params.id}
            canSubmit={event.status === 'live'}
          />
        </main>

        {/* ── Right panel ── */}
        <aside className="bg-bg2 border-l border-[rgba(232,184,75,0.10)] overflow-y-auto flex flex-col">
          {isOwnerOrMod && pendingSubmissions.length > 0 && (
            <SubmissionsPanel submissions={pendingSubmissions} />
          )}
          <MemberList
            members={members ?? []}
            teams={teams ?? []}
            currentUserId={user.id}
            isOwnerOrMod={isOwnerOrMod}
            eventId={params.id}
          />
        </aside>
      </div>
    </div>
  )
}

function CountdownBadge({ endDate }: { endDate: string }) {
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return <Badge variant="gray">ENDED</Badge>
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const label = d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`
  const variant = diff < 3600000 ? 'red' : diff < 86400000 ? 'gold' : 'green'
  return <Badge variant={variant}>{label.toUpperCase()}</Badge>
}
