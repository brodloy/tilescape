import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ManageClient } from '@/components/event/ManageClient'

export default async function ManagePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await db.from('events').select('*').eq('id', params.id).single()
  if (!event) notFound()

  const { data: membership } = await db
    .from('event_members').select('role')
    .eq('event_id', params.id).eq('user_id', user.id).single()

  if (!membership || !['owner', 'moderator'].includes(membership.role))
    redirect(`/events/${params.id}`)

  const isOwner = membership.role === 'owner'

  const { data: tiles } = await db
    .from('tiles').select('*').eq('event_id', params.id).order('position')

  const { data: teams } = await db
    .from('teams')
    .select('*, team_members(id, event_members(id, users(id, display_name, avatar_url)))')
    .eq('event_id', params.id).order('created_at')

  const { data: members } = await db
    .from('event_members')
    .select('id, role, users(id, display_name, avatar_url)')
    .eq('event_id', params.id).order('joined_at')

  const currentMember = (members ?? []).find((m: any) => m.users?.id === user.id)
  const avatarUrl = currentMember?.users?.avatar_url ?? null

  return (
    <ManageClient
      event={event}
      tiles={tiles ?? []}
      teams={teams ?? []}
      members={members ?? []}
      isOwner={isOwner}
      currentUserId={user.id}
      avatarUrl={avatarUrl}
    />
  )
}
