'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

function generateInviteCode(): string {
  return nanoid(8).toUpperCase()
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name        = formData.get('name') as string
  const description = formData.get('description') as string
  const startDate   = formData.get('start_date') as string
  const endDate     = formData.get('end_date') as string

  if (!name?.trim()) return { error: 'Event name is required' }

  const inviteCode = generateInviteCode()

  const { data: event, error: eventError } = await db
    .from('events')
    .insert({
      name:        name.trim(),
      description: description?.trim() || null,
      created_by:  user.id,
      start_date:  startDate || null,
      end_date:    endDate   || null,
      invite_code: inviteCode,
      status:      'draft',
    })
    .select()
    .single()

  if (eventError) return { error: eventError.message }

  const { error: memberError } = await db
    .from('event_members')
    .insert({ event_id: event.id, user_id: user.id, role: 'owner' })

  if (memberError) return { error: memberError.message }

  revalidatePath('/dashboard')
  redirect(`/events/${event.id}`)
}

export async function joinEvent(inviteCode: string) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: event, error: eventError } = await db
    .from('events')
    .select('id, status, name')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (eventError || !event) return { error: 'Invalid invite code' }
  if (event.status === 'ended') return { error: 'This event has ended' }

  const { data: existing } = await db
    .from('event_members')
    .select('id')
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .single()

  if (existing) redirect(`/events/${event.id}`)

  const { error: joinError } = await db
    .from('event_members')
    .insert({ event_id: event.id, user_id: user.id, role: 'member' })

  if (joinError) return { error: joinError.message }

  revalidatePath('/dashboard')
  redirect(`/events/${event.id}`)
}

export async function updateEventStatus(
  eventId: string,
  status: 'draft' | 'live' | 'ended'
) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await db
    .from('events')
    .update({ status })
    .eq('id', eventId)
    .eq('created_by', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function updateMemberRole(
  eventId: string,
  memberId: string,
  role: 'moderator' | 'member'
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

  if (!caller || caller.role !== 'owner')
    return { error: 'Only the event owner can change roles' }

  const { error } = await db
    .from('event_members')
    .update({ role })
    .eq('id', memberId)
    .eq('event_id', eventId)

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
