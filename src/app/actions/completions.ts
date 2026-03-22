'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitCompletion(
  tileId: string,
  teamId: string,
  proofUrl: string
) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!proofUrl?.trim()) return { error: 'Proof URL is required' }
  try { new URL(proofUrl) } catch { return { error: 'Please enter a valid URL' } }

  const { data: tile } = await db
    .from('tiles')
    .select('id, event_id')
    .eq('id', tileId)
    .single()

  if (!tile) return { error: 'Tile not found' }
  const { data: member } = await db
    .from('event_members')
    .select('id')
    .eq('event_id', tile.event_id)
    .eq('user_id', user.id)
    .single()

  if (!member) return { error: 'You are not a member of this event' }

  const { data: teamMembership } = await db
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('event_member_id', member.id)
    .single()

  if (!teamMembership) return { error: 'You are not on this team' }

  const { data: existing } = await db
    .from('tile_completions')
    .select('id, status')
    .eq('tile_id', tileId)
    .eq('team_id', teamId)
    .single()

  if (existing) {
    if (existing.status === 'approved')
      return { error: 'This tile is already approved for your team' }
    if (existing.status === 'pending')
      return { error: 'A submission is already pending review' }

    // Rejected — allow resubmission
    const { error } = await db
      .from('tile_completions')
      .update({
        proof_url:   proofUrl.trim(),
        status:      'pending',
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        reviewed_at:  null,
        reviewed_by:  null,
      })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await db
      .from('tile_completions')
      .insert({
        tile_id:      tileId,
        team_id:      teamId,
        submitted_by: user.id,
        proof_url:    proofUrl.trim(),
        status:       'pending',
      })

    if (error) return { error: error.message }
  }

  revalidatePath(`/events/${tile.event_id}`)
  return { success: true }
}

export async function reviewCompletion(
  completionId: string,
  decision: 'approved' | 'rejected'
) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: completion } = await db
    .from('tile_completions')
    .select('id, tile_id, tiles(event_id)')
    .eq('id', completionId)
    .single()

  if (!completion) return { error: 'Completion not found' }
  const eventId = completion.tiles?.event_id
  if (!eventId) return { error: 'Event not found' }

  const { data: member } = await db
    .from('event_members')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'moderator'].includes(member.role))
    return { error: 'You do not have permission to review submissions' }

  const { error } = await db
    .from('tile_completions')
    .update({
      status:      decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', completionId)

  if (error) return { error: error.message }

  if (decision === 'approved') {
    await fireDiscordWebhook(completionId, eventId, db)
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

async function fireDiscordWebhook(
  completionId: string,
  eventId: string,
  db: any
) {
  try {
    const { data: event } = await db
      .from('events')
      .select('discord_webhook_url, name')
      .eq('id', eventId)
      .single()

    if (!event?.discord_webhook_url) return

    const { data: completion } = await db
      .from('tile_completions')
      .select(`proof_url, tiles(name, is_purple, source_raid), teams(name, color), users!submitted_by(display_name)`)
      .eq('id', completionId)
      .single()

    if (!completion) return

    const { tiles: tile, teams: team, users: submitter } = completion

    await fetch(event.discord_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title:       '✅ Tile Completed',
          description: `**${submitter?.display_name}** completed **${tile?.name}** for **${team?.name}**`,
          color:       parseInt((team?.color ?? '#e8b84b').replace('#', ''), 16),
          fields: [
            { name: 'Tile',   value: tile?.name       ?? '—', inline: true },
            { name: 'Team',   value: team?.name       ?? '—', inline: true },
          ],
          image:     { url: completion.proof_url },
          footer:    { text: `TileScape · ${event.name}` },
          timestamp: new Date().toISOString(),
        }],
      }),
    })
  } catch {
    // Webhook failure is non-fatal
  }
}

// Dev mode: instant approval without proof
export async function quickCompleteTile(tileId: string, teamId: string) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: tile } = await db
    .from('tiles').select('id, event_id, name')
    .eq('id', tileId).single()

  if (!tile) return { error: 'Invalid tile' }

  const { data: member } = await db
    .from('event_members').select('id')
    .eq('event_id', tile.event_id).eq('user_id', user.id).single()

  if (!member) return { error: 'Not a member' }

  const { data: teamMembership } = await db
    .from('team_members').select('id')
    .eq('team_id', teamId).eq('event_member_id', member.id).single()

  if (!teamMembership) return { error: 'Not on this team' }

  const { data: existing } = await db
    .from('tile_completions').select('id, status')
    .eq('tile_id', tileId).eq('team_id', teamId).single()

  if (existing?.status === 'approved') return { error: 'Already approved' }

  const completionData = {
    tile_id: tileId, team_id: teamId,
    submitted_by: user.id, proof_url: '',
    status: 'approved',
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  }

  if (existing) {
    await db.from('tile_completions').update(completionData).eq('id', existing.id)
  } else {
    await db.from('tile_completions').insert(completionData)
  }

  revalidatePath(`/events/${tile.event_id}`)
  return { success: true, tileName: tile.name }
}

// Undo a quick completion
export async function uncompleteTeamTile(tileId: string, teamId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: tile } = await db.from('tiles').select('event_id').eq('id', tileId).single()
  if (!tile) return { error: 'Tile not found' }

  // Verify user is a member of this event and on this team
  const { data: member } = await db
    .from('event_members').select('id, role')
    .eq('event_id', tile.event_id).eq('user_id', user.id).single()
  if (!member) return { error: 'Not a member of this event' }

  const { data: teamMembership } = await db
    .from('team_members').select('id')
    .eq('team_id', teamId).eq('event_member_id', member.id).single()
  if (!teamMembership) return { error: 'Not on this team' }

  // Use admin client to bypass RLS on delete
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient() as any
  const { error } = await admin.from('tile_completions')
    .delete()
    .eq('tile_id', tileId)
    .eq('team_id', teamId)

  if (error) return { error: error.message }

  revalidatePath(`/events/${tile.event_id}`)
  return { success: true }
}
