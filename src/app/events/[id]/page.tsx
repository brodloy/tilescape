import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BoardClient } from '@/components/event/BoardClient'

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await db.from('events').select('*, prize_pool').eq('id', params.id).single()
  if (!event) notFound()

  const { data: membership } = await db
    .from('event_members').select('id, role')
    .eq('event_id', params.id).eq('user_id', user.id).single()

  if (!membership) redirect(`/join?code=${event.invite_code}`)

  const isOwnerOrMod = ['owner', 'moderator'].includes(membership.role)

  const { data: tiles } = await db
    .from('tiles')
    .select('*, tile_completions(id, status, proof_url, submitted_at, team_id, users!submitted_by(display_name))')
    .eq('event_id', params.id).order('position')

  const { data: teams } = await db
    .from('teams')
    .select('*, team_members(id, event_members(id, role, users(id, display_name, avatar_url)))')
    .eq('event_id', params.id).order('created_at')

  const { data: members } = await db
    .from('event_members')
    .select('id, role, joined_at, users(id, display_name, avatar_url)')
    .eq('event_id', params.id).order('joined_at')

  let pendingSubmissions: any[] = []
  if (isOwnerOrMod) {
    const tileIds = (tiles ?? []).map((t: any) => t.id)
    if (tileIds.length > 0) {
      const { data } = await db
        .from('tile_completions')
        .select('id, proof_url, status, submitted_at, tile_id, tiles(name, sprite_url), teams(name, color), users!submitted_by(display_name, avatar_url)')
        .eq('status', 'pending').in('tile_id', tileIds)
        .order('submitted_at', { ascending: false })
      pendingSubmissions = data ?? []
    }
  }

  const userMember = (members ?? []).find((m: any) => m.users?.id === user.id)
  const userTeam = (teams ?? []).find((t: any) =>
    t.team_members?.some((tm: any) => tm.event_members?.id === userMember?.id)
  )

  const displayName = userMember?.users?.display_name ?? ''
  const avatarUrl = userMember?.users?.avatar_url ?? null

  return (
    <BoardClient
      event={event}
      initialTiles={tiles ?? []}
      teams={teams ?? []}
      members={members ?? []}
      pendingSubmissions={pendingSubmissions}
      userTeamId={userTeam?.id ?? null}
      isOwnerOrMod={isOwnerOrMod}
      isOwner={membership.role === 'owner'}
      displayName={displayName}
      avatarUrl={avatarUrl}
      requireProof={event.require_proof ?? false}
      eventId={params.id}
    />
  )
}
