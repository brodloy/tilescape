'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateEventStatus, updateMemberRole, createEvent } from '@/app/actions/events'
import { addTile, deleteTile, setBoardTemplate } from '@/app/actions/tiles'
import { createTeam, deleteTeam, assignMemberToTeam } from '@/app/actions/teams'

// ── Event page ──
export async function goLive(eventId: string) {
  await updateEventStatus(eventId, 'live')
}

export async function endEvent(eventId: string) {
  await updateEventStatus(eventId, 'ended')
}

// ── Manage page ──
export async function loadTemplate(eventId: string) {
  await setBoardTemplate(eventId)
}

export async function removeTile(tileId: string, eventId: string) {
  await deleteTile(tileId, eventId)
}

export async function addTileAction(eventId: string, formData: FormData) {
  await addTile(eventId, formData)
}

export async function addTeamAction(eventId: string, formData: FormData) {
  const name  = formData.get('name') as string
  const color = formData.get('color') as string
  if (name && color) await createTeam(eventId, name, color)
}

export async function removeTeam(teamId: string, eventId: string) {
  await deleteTeam(teamId, eventId)
}

export async function assignTeam(eventMemberId: string, eventId: string, formData: FormData) {
  const teamId = formData.get('team_id') as string
  await assignMemberToTeam(eventMemberId, teamId, eventId)
}

export async function toggleMod(memberId: string, eventId: string, currentRole: string) {
  const newRole = currentRole === 'moderator' ? 'member' : 'moderator'
  await updateMemberRole(eventId, memberId, newRole as 'moderator' | 'member')
}

export async function saveWebhook(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any
  const url = formData.get('webhook_url') as string
  await db.from('events').update({ discord_webhook_url: url || null }).eq('id', eventId)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const displayName = (formData.get('display_name') as string)?.trim()
  if (displayName) {
    await db.from('users').update({ display_name: displayName }).eq('id', user.id)
  }
  redirect('/account?updated=1')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirm  = formData.get('confirm') as string
  if (!password || password !== confirm) redirect('/account?error=password_mismatch')
  await supabase.auth.updateUser({ password })
  redirect('/account?updated=1')
}

export async function createEventAction(formData: FormData) {
  await createEvent(formData)
}

export async function joinEventAction(formData: FormData) {
  const { joinEvent } = await import('@/app/actions/events')
  const code = formData.get('code') as string
  if (code?.trim()) await joinEvent(code.trim())
}

export async function joinEventWithRedirect(formData: FormData) {
  const { joinEvent } = await import('@/app/actions/events')
  const code = formData.get('code') as string
  const returnCode = formData.get('return_code') as string
  if (!code?.trim()) return
  const result = await joinEvent(code.trim())
  if (result?.error) {
    const base = `/join?error=${encodeURIComponent(result.error)}`
    redirect(returnCode ? `${base}&code=${returnCode}` : base)
  }
}
