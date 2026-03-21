'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addTile(eventId: string, formData: FormData) {
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
    return { error: 'Only owner or moderator can add tiles' }

  const name       = (formData.get('name') as string)?.trim()
  const sourceRaid = (formData.get('source_raid') as string)?.trim() || null
  const isPurple   = formData.get('is_purple') === 'true'
  const spriteUrl  = (formData.get('sprite_url') as string)?.trim() || null
  const points     = parseInt(formData.get('points') as string) || 1
  const position   = parseInt(formData.get('position') as string)
  const freeSpace  = formData.get('free_space') === 'true'

  if (!name) return { error: 'Tile name is required' }
  if (isNaN(position) || position < 0 || position > 24)
    return { error: 'Position must be 0–24' }

  // Check position not already taken
  const { data: existing } = await db
    .from('tiles')
    .select('id')
    .eq('event_id', eventId)
    .eq('position', position)
    .single()

  if (existing) return { error: `Position ${position} is already occupied` }

  const { error } = await db.from('tiles').insert({
    event_id:    eventId,
    name,
    source_raid: sourceRaid,
    is_purple:   isPurple,
    sprite_url:  spriteUrl,
    points,
    position,
    free_space:  freeSpace,
  })

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

export async function updateTile(tileId: string, eventId: string, formData: FormData) {
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
    return { error: 'Only owner or moderator can edit tiles' }

  const { error } = await db
    .from('tiles')
    .update({
      name:        (formData.get('name') as string)?.trim(),
      source_raid: (formData.get('source_raid') as string)?.trim() || null,
      is_purple:   formData.get('is_purple') === 'true',
      sprite_url:  (formData.get('sprite_url') as string)?.trim() || null,
      points:      parseInt(formData.get('points') as string) || 1,
    })
    .eq('id', tileId)

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function deleteTile(tileId: string, eventId: string) {
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
    return { error: 'Only owner or moderator can delete tiles' }

  const { error } = await db
    .from('tiles')
    .delete()
    .eq('id', tileId)
    .eq('event_id', eventId)

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function setBoardTemplate(eventId: string) {
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
    return { error: 'Only the event owner can set a template' }

  // Delete existing tiles
  await db.from('tiles').delete().eq('event_id', eventId)

  const WIKI = 'https://oldschool.runescape.wiki/w/Special:FilePath/'
  const w = (n: string) => `${WIKI}${encodeURIComponent(n.replace(/ /g, '_'))}.png`

  const defaultTiles = [
    { position:  0, name: 'Twisted bow',           source_raid: 'CoX',     is_purple: true,  sprite_url: w('Twisted bow') },
    { position:  1, name: 'Scythe of vitur',       source_raid: 'ToB',     is_purple: true,  sprite_url: w('Scythe of vitur') },
    { position:  2, name: "Tumeken's shadow",       source_raid: 'ToA',     is_purple: true,  sprite_url: w("Tumeken's shadow") },
    { position:  3, name: 'Ghrazi rapier',          source_raid: 'ToB',     is_purple: true,  sprite_url: w('Ghrazi rapier') },
    { position:  4, name: "Osmumten's fang",        source_raid: 'ToA',     is_purple: true,  sprite_url: w("Osmumten's fang") },
    { position:  5, name: 'Kodai wand',             source_raid: 'CoX',     is_purple: false, sprite_url: w('Kodai wand') },
    { position:  6, name: 'Elder maul',             source_raid: 'CoX',     is_purple: false, sprite_url: w('Elder maul') },
    { position:  7, name: 'Avernic hilt',           source_raid: 'ToB',     is_purple: false, sprite_url: w('Avernic defender hilt') },
    { position:  8, name: 'Zaryte crossbow',        source_raid: 'Nex',     is_purple: false, sprite_url: w('Zaryte crossbow') },
    { position:  9, name: 'Sanguinesti staff',      source_raid: 'ToB',     is_purple: false, sprite_url: w('Sanguinesti staff') },
    { position: 10, name: 'Dragon hunter crossbow', source_raid: 'CoX',     is_purple: false, sprite_url: w('Dragon hunter crossbow') },
    { position: 11, name: 'Justiciar faceguard',    source_raid: 'ToB',     is_purple: false, sprite_url: w('Justiciar faceguard') },
    { position: 12, name: 'FREE',                   source_raid: null,      is_purple: false, sprite_url: null, free_space: true },
    { position: 13, name: "Elidinis' ward",         source_raid: 'ToA',     is_purple: false, sprite_url: w("Elidinis' ward (f)") },
    { position: 14, name: 'Lightbearer',            source_raid: 'ToA',     is_purple: false, sprite_url: w('Lightbearer') },
    { position: 15, name: 'Olmlet',                 source_raid: 'CoX',     is_purple: true,  sprite_url: w('Olmlet') },
    { position: 16, name: 'Magus ring',             source_raid: 'DT2',     is_purple: true,  sprite_url: w('Magus ring') },
    { position: 17, name: "Inquisitor's mace",      source_raid: 'NM',      is_purple: false, sprite_url: w("Inquisitor's mace") },
    { position: 18, name: 'Dragon warhammer',       source_raid: 'Liz',     is_purple: false, sprite_url: w('Dragon warhammer') },
    { position: 19, name: 'Infernal cape',          source_raid: 'Inferno', is_purple: true,  sprite_url: w('Infernal cape') },
    { position: 20, name: "Lil' Zik",               source_raid: 'ToB',     is_purple: true,  sprite_url: w("Lil' zik") },
    { position: 21, name: 'Jal-nib-rek',            source_raid: 'Inferno', is_purple: true,  sprite_url: w('Jal-nib-rek') },
    { position: 22, name: 'Nightmare staff',        source_raid: 'NM',      is_purple: true,  sprite_url: w('Nightmare staff') },
    { position: 23, name: 'Ancestral robe top',     source_raid: 'CoX',     is_purple: false, sprite_url: w('Ancestral robe top') },
    { position: 24, name: 'Blood torva',            source_raid: 'Nex',     is_purple: true,  sprite_url: w('Ancient blood ornament kit') },
  ]

  const tilesToInsert = defaultTiles.map(t => ({
    event_id:    eventId,
    points:      1,
    free_space:  false,
    ...t,
  }))

  const { error } = await db.from('tiles').insert(tilesToInsert)
  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}/manage`)
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
