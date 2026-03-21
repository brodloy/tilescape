'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createTeam(eventId: string, name: string, color: string) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await db
    .from('event_members')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'moderator'].includes(member.role))
    return { error: 'Only the event owner can create teams' }

  const { data: team, error } = await db
    .from('teams')
    .insert({ event_id: eventId, name: name.trim(), color })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { team }
}

export async function deleteTeam(teamId: string, eventId: string) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: member } = await db
    .from('event_members')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'owner')
    return { error: 'Only the event owner can delete teams' }

  const { error } = await db
    .from('teams')
    .delete()
    .eq('id', teamId)
    .eq('event_id', eventId)

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function assignMemberToTeam(
  eventMemberId: string,
  teamId: string,
  eventId: string
) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: caller } = await db
    .from('event_members')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (!caller || !['owner', 'moderator'].includes(caller.role))
    return { error: 'Only owner or moderator can assign teams' }

  // Remove from any existing team in this event
  const { data: existingTeams } = await db
    .from('teams')
    .select('id')
    .eq('event_id', eventId)

  if (existingTeams?.length) {
    await db
      .from('team_members')
      .delete()
      .eq('event_member_id', eventMemberId)
      .in('team_id', existingTeams.map((t: any) => t.id))
  }

  // Assign to new team (empty string = unassign)
  if (teamId) {
    const { error } = await db
      .from('team_members')
      .insert({ team_id: teamId, event_member_id: eventMemberId })

    if (error) return { error: error.message }
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
