'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createEventVoid(formData: FormData): Promise<void> {
  await createEventAction(formData)
}

export async function goLive(eventId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await db.from('events').update({ status: 'live' }).eq('id', eventId).eq('created_by', user.id)
  revalidatePath(`/events/${eventId}`)
}

export async function endEvent(eventId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await db.from('events').update({ status: 'ended' }).eq('id', eventId).eq('created_by', user.id)
  revalidatePath(`/events/${eventId}`)
}

// ── Manage page ──
export async function loadTemplate(eventId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const WIKI = 'https://oldschool.runescape.wiki/w/Special:FilePath/'
  const w = (n: string) => `${WIKI}${encodeURIComponent(n.replace(/ /g, '_'))}.png`

  await db.from('tiles').delete().eq('event_id', eventId)

  await db.from('tiles').insert([
    { event_id: eventId, position: 0,  name: 'Twisted bow',  sprite_url: w('Twisted bow'),            points: 1 },
    { event_id: eventId, position: 1,  name: 'Scythe of vitur',  sprite_url: w('Scythe of vitur'),         points: 1 },
    { event_id: eventId, position: 2,  name: "Tumeken's shadow",  sprite_url: w("Tumeken's shadow"),        points: 1 },
    { event_id: eventId, position: 3,  name: 'Ghrazi rapier',  sprite_url: w('Ghrazi rapier'),           points: 1 },
    { event_id: eventId, position: 4,  name: "Osmumten's fang",  sprite_url: w("Osmumten's fang"),         points: 1 },
    { event_id: eventId, position: 5,  name: 'Kodai wand', sprite_url: w('Kodai wand'),              points: 1 },
    { event_id: eventId, position: 6,  name: 'Elder maul', sprite_url: w('Elder maul'),              points: 1 },
    { event_id: eventId, position: 7,  name: 'Avernic hilt', sprite_url: w('Avernic defender hilt'),   points: 1 },
    { event_id: eventId, position: 8,  name: 'Zaryte crossbow', sprite_url: w('Zaryte crossbow'),         points: 1 },
    { event_id: eventId, position: 9,  name: 'Sanguinesti staff', sprite_url: w('Sanguinesti staff'),       points: 1 },
    { event_id: eventId, position: 10, name: 'Dragon hunter crossbow', sprite_url: w('Dragon hunter crossbow'),  points: 1 },
    { event_id: eventId, position: 11, name: 'Justiciar faceguard', sprite_url: w('Justiciar faceguard'),     points: 1 },
    { event_id: eventId, position: 12, name: 'FREE', sprite_url: null,                         points: 0  },
    { event_id: eventId, position: 13, name: "Elidinis' ward", sprite_url: w("Elidinis' ward (f)"),      points: 1 },
    { event_id: eventId, position: 14, name: 'Lightbearer', sprite_url: w('Lightbearer'),             points: 1 },
    { event_id: eventId, position: 15, name: 'Olmlet',  sprite_url: w('Olmlet'),                  points: 1 },
    { event_id: eventId, position: 16, name: 'Magus ring',  sprite_url: w('Magus ring'),              points: 1 },
    { event_id: eventId, position: 17, name: "Inquisitor's mace", sprite_url: w("Inquisitor's mace"),       points: 1 },
    { event_id: eventId, position: 18, name: 'Dragon warhammer', sprite_url: w('Dragon warhammer'),        points: 1 },
    { event_id: eventId, position: 19, name: 'Infernal cape',  sprite_url: w('Infernal cape'),           points: 1 },
    { event_id: eventId, position: 20, name: "Lil' Zik",  sprite_url: w("Lil' zik"),                points: 1 },
    { event_id: eventId, position: 21, name: 'Jal-nib-rek',  sprite_url: w('Jal-nib-rek'),             points: 1 },
    { event_id: eventId, position: 22, name: 'Nightmare staff',  sprite_url: w('Nightmare staff'),         points: 1 },
    { event_id: eventId, position: 23, name: 'Ancestral robe top', sprite_url: w('Ancestral robe top'),      points: 1 },
    { event_id: eventId, position: 24, name: 'Blood torva',  sprite_url: w('Ancient blood ornament kit'), points: 1 },
  ])

  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
}

export async function removeTile(tileId: string, eventId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await db.from('tiles').delete().eq('id', tileId).eq('event_id', eventId)
  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
}

export async function addTileAction(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const name       = (formData.get('name') as string)?.trim()
  const sourceRaid = (formData.get('source_raid') as string)?.trim() || null
  const isPurple   = formData.get('is_purple') === 'true'
  const spriteUrl  = (formData.get('sprite_url') as string)?.trim() || null
  const points     = parseInt(formData.get('points') as string) || 1
  const position   = parseInt(formData.get('position') as string)
  const freeSpace  = formData.get('free_space') === 'true'

  if (!name || isNaN(position)) return

  await db.from('tiles').insert({
    event_id: eventId, name, source_raid: sourceRaid,
    is_purple: isPurple, sprite_url: spriteUrl,
    points, position, free_space: freeSpace,
  })

  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
}

export async function addTeamAction(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const name  = (formData.get('name') as string)?.trim()
  const color = formData.get('color') as string
  if (!name || !color) return

  await db.from('teams').insert({ event_id: eventId, name, color })
  revalidatePath(`/events/${eventId}/manage`)
}

export async function removeTeam(teamId: string, eventId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await db.from('teams').delete().eq('id', teamId).eq('event_id', eventId)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function assignTeam(eventMemberId: string, eventId: string, formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const teamId = formData.get('team_id') as string

  // Get all team IDs for this event to remove from any existing
  const { data: allTeams } = await db.from('teams').select('id').eq('event_id', eventId)
  if (allTeams?.length) {
    await db.from('team_members')
      .delete()
      .eq('event_member_id', eventMemberId)
      .in('team_id', allTeams.map((t: any) => t.id))
  }

  if (teamId) {
    await db.from('team_members').insert({ team_id: teamId, event_member_id: eventMemberId })
  }

  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
}

export async function toggleMod(memberId: string, eventId: string, currentRole: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const newRole = currentRole === 'moderator' ? 'member' : 'moderator'
  await db.from('event_members').update({ role: newRole }).eq('id', memberId).eq('event_id', eventId)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function saveWebhook(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const url = (formData.get('webhook_url') as string)?.trim() || null
  await db.from('events').update({ discord_webhook_url: url }).eq('id', eventId)
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
  redirect('/account')
}

export async function createEventAction(formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name        = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const startDate   = formData.get('start_date') as string
  const endDate     = formData.get('end_date') as string
  const webhookUrl  = (formData.get('discord_webhook_url') as string)?.trim()

  if (!name) return { error: 'Event name is required' }

  // Ensure user profile exists (may not if trigger didn't fire)
  const { data: profile } = await db
    .from('users').select('id').eq('id', user.id).single()

  if (!profile) {
    const { error: upsertError } = await db.from('users').upsert({
      id:           user.id,
      email:        user.email,
      display_name: user.user_metadata?.display_name
                    ?? user.user_metadata?.full_name
                    ?? user.email?.split('@')[0]
                    ?? 'Player',
    })
    if (upsertError) return { error: `Profile error: ${upsertError.message}` }
  }

  const inviteCode = Math.random().toString(36).substring(2, 6).toUpperCase()
               + Math.random().toString(36).substring(2, 6).toUpperCase()

  const { data: event, error: eventError } = await db
    .from('events')
    .insert({
      name,
      description:         description || null,
      created_by:          user.id,
      start_date:          startDate || null,
      end_date:            endDate || null,
      invite_code:         inviteCode,
      status:              'draft',
      discord_webhook_url: webhookUrl || null,
    })
    .select()
    .single()

  if (eventError) return { error: `Failed to create event: ${eventError.message}` }
  if (!event) return { error: 'Event was not created' }

  const { error: memberError } = await db
    .from('event_members')
    .insert({ event_id: event.id, user_id: user.id, role: 'owner' })

  if (memberError) return { error: `Member error: ${memberError.message}` }

  revalidatePath('/dashboard')
  redirect(`/events/${event.id}`)
}

export async function joinEventAction(formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = (formData.get('code') as string)?.trim().toUpperCase()
  if (!code) return

  const { data: event } = await db
    .from('events')
    .select('id, status')
    .eq('invite_code', code)
    .single()

  if (!event) {
    redirect(`/join?code=${code}&error=invalid`)
  }

  if (event.status === 'ended') {
    redirect(`/join?code=${code}&error=${encodeURIComponent('This event has ended')}`)
  }

  const { data: existing } = await db
    .from('event_members')
    .select('id')
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    // Ensure public.users row exists for brand-new Discord users
    const { data: existingUser } = await db.from('users').select('id').eq('id', user.id).single()
    if (!existingUser) {
      const identity = user.identities?.find((i: any) => i.provider === 'discord')
      await db.from('users').insert({
        id: user.id,
        email: user.email ?? '',
        display_name: identity?.identity_data?.full_name ?? identity?.identity_data?.name ?? user.email?.split('@')[0] ?? 'Adventurer',
        avatar_url: identity?.identity_data?.avatar_url ?? null,
      })
    }

    await db
      .from('event_members')
      .insert({ event_id: event.id, user_id: user.id, role: 'member' })
  }

  revalidatePath('/dashboard')
  redirect(`/events/${event.id}`)
}

export async function joinEventWithRedirect(formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code       = (formData.get('code') as string)?.trim().toUpperCase()
  const returnCode = formData.get('return_code') as string
  if (!code) return

  const { data: event } = await db
    .from('events')
    .select('id, status')
    .eq('invite_code', code)
    .single()

  if (!event) {
    redirect(`/join?error=${encodeURIComponent('Invalid invite code')}${returnCode ? `&code=${returnCode}` : ''}`)
  }

  if (event.status === 'ended') {
    redirect(`/join?error=${encodeURIComponent('This event has ended')}&code=${code}`)
  }

  // Ensure public.users row exists (trigger may not have fired yet for brand-new Discord users)
  const { data: existingUser } = await db.from('users').select('id').eq('id', user.id).single()
  if (!existingUser) {
    const identity = user.identities?.find((i: any) => i.provider === 'discord')
    await db.from('users').insert({
      id: user.id,
      email: user.email ?? '',
      display_name: identity?.identity_data?.full_name
        ?? identity?.identity_data?.name
        ?? user.email?.split('@')[0]
        ?? 'Adventurer',
      avatar_url: identity?.identity_data?.avatar_url ?? null,
    })
  }

  const { data: existing } = await db
    .from('event_members')
    .select('id')
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    const { error: joinError } = await db
      .from('event_members')
      .insert({ event_id: event.id, user_id: user.id, role: 'member' })

    if (joinError) {
      redirect(`/join?error=${encodeURIComponent('Failed to join event. Please try again.')}&code=${code}`)
    }
  }

  revalidatePath('/dashboard')
  redirect(`/events/${event.id}`)
}

export async function savePrizePool(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const raw = formData.get('prize_pool') as string
  const prize_pool = parseInt(raw.replace(/,/g, '').replace(/\D/g, '')) || 0
  await db.from('events').update({ prize_pool }).eq('id', eventId)
  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/dashboard')
}

export async function saveRequireProof(eventId: string, requireProof: boolean) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await db.from('events').update({ require_proof: requireProof }).eq('id', eventId)
  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
}

export async function syncDiscordAvatar() {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get fresh avatar from Discord via Supabase identity
  const identity = user.identities?.find((i: any) => i.provider === 'discord')
  if (!identity) return { error: 'No Discord account linked' }

  const avatarUrl = identity.identity_data?.avatar_url
  if (!avatarUrl) return { error: 'No avatar found on Discord account' }

  await db.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id)
  revalidatePath('/account')
  revalidatePath('/dashboard')
  return { success: true }
}
