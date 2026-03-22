'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Only owner can delete
  const { data: event } = await db
    .from('events')
    .select('id, created_by')
    .eq('id', eventId)
    .single()

  if (!event) return { error: 'Event not found' }
  if (event.created_by !== user.id) return { error: 'Only the event owner can delete this event' }

  const { error } = await db
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function deleteEventVoid(eventId: string): Promise<void> {
  await deleteEvent(eventId)
}
