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
    event_id:   eventId,
    name,
    sprite_url: spriteUrl,
    points,
    position,
    free_space: freeSpace,
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
    { position:  0, name: 'Twisted bow',            sprite_url: w('Twisted bow') },
    { position:  1, name: 'Scythe of vitur',        sprite_url: w('Scythe of vitur') },
    { position:  2, name: "Tumeken's shadow",        sprite_url: w("Tumeken's shadow") },
    { position:  3, name: 'Ghrazi rapier',           sprite_url: w('Ghrazi rapier') },
    { position:  4, name: "Osmumten's fang",         sprite_url: w("Osmumten's fang") },
    { position:  5, name: 'Kodai wand',              sprite_url: w('Kodai wand') },
    { position:  6, name: 'Elder maul',              sprite_url: w('Elder maul') },
    { position:  7, name: 'Avernic hilt',            sprite_url: w('Avernic defender hilt') },
    { position:  8, name: 'Zaryte crossbow',         sprite_url: w('Zaryte crossbow') },
    { position:  9, name: 'Sanguinesti staff',       sprite_url: w('Sanguinesti staff') },
    { position: 10, name: 'Dragon hunter crossbow',  sprite_url: w('Dragon hunter crossbow') },
    { position: 11, name: 'Justiciar faceguard',     sprite_url: w('Justiciar faceguard') },
    { position: 12, name: 'FREE',                    sprite_url: null, free_space: true },
    { position: 13, name: "Elidinis' ward",          sprite_url: w("Elidinis' ward (f)") },
    { position: 14, name: 'Lightbearer',             sprite_url: w('Lightbearer') },
    { position: 15, name: 'Olmlet',                  sprite_url: w('Olmlet') },
    { position: 16, name: 'Magus ring',              sprite_url: w('Magus ring') },
    { position: 17, name: "Inquisitor's mace",       sprite_url: w("Inquisitor's mace") },
    { position: 18, name: 'Dragon warhammer',        sprite_url: w('Dragon warhammer') },
    { position: 19, name: 'Infernal cape',           sprite_url: w('Infernal cape') },
    { position: 20, name: "Lil' Zik",                sprite_url: w("Lil' zik") },
    { position: 21, name: 'Jal-nib-rek',             sprite_url: w('Jal-nib-rek') },
    { position: 22, name: 'Nightmare staff',         sprite_url: w('Nightmare staff') },
    { position: 23, name: 'Ancestral robe top',      sprite_url: w('Ancestral robe top') },
    { position: 24, name: 'Blood torva',             sprite_url: w('Ancient blood ornament kit') },
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
