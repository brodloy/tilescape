import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  loadTemplate, removeTile, addTileAction,
  addTeamAction, removeTeam, assignTeam, toggleMod, saveWebhook,
} from '@/app/actions/forms'

const WIKI = 'https://oldschool.runescape.wiki/w/Special:FilePath/'
const w = (n: string) => `${WIKI}${encodeURIComponent(n.replace(/ /g, '_'))}.png`

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
  const eventId = params.id

  const { data: tiles } = await db
    .from('tiles').select('*').eq('event_id', eventId).order('position')

  const { data: teams } = await db
    .from('teams')
    .select('*, team_members(id, event_members(id, users(id, display_name)))')
    .eq('event_id', eventId).order('created_at')

  const { data: members } = await db
    .from('event_members')
    .select('id, role, users(id, display_name)')
    .eq('event_id', eventId).order('joined_at')

  const memberTeamMap = new Map<string, any>()
  ;(teams ?? []).forEach((t: any) => {
    t.team_members?.forEach((tm: any) => {
      if (tm.event_members?.id) memberTeamMap.set(tm.event_members.id, t)
    })
  })

  const occupiedPositions = new Set((tiles ?? []).map((t: any) => t.position))
  const nextFreePosition = Array.from({ length: 25 }, (_, i) => i).find(i => !occupiedPositions.has(i)) ?? -1

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 h-14 bg-bg2 border-b border-[rgba(232,184,75,0.20)] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href={`/events/${eventId}`} className="text-text-2 hover:text-text text-sm transition-colors">← Board</Link>
          <span className="text-text-3">/</span>
          <span className="font-syne font-bold text-sm">Manage Event</span>
          <span className="font-pixel text-[6px] text-gold-dim truncate max-w-[200px]">{event.name}</span>
        </div>
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="sm">View Board</Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── TILE BUILDER ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <span className="font-pixel text-[7px] text-gold tracking-widest">BINGO BOARD</span>
                <p className="text-xs text-text-2 mt-0.5">{(tiles ?? []).length} / 25 tiles placed</p>
              </div>
              {isOwner && (tiles ?? []).length === 0 && (
                <form action={loadTemplate.bind(null, eventId)}>
                  <Button type="submit" size="sm" variant="ghost">Load OSRS Template</Button>
                </form>
              )}
            </CardHeader>
            <CardBody className="p-4">
              <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {Array.from({ length: 25 }, (_, pos) => {
                  const tile = (tiles ?? []).find((t: any) => t.position === pos)
                  return (
                    <div key={pos} className={`aspect-square rounded border flex flex-col items-center justify-center p-1 relative text-center ${
                      tile
                        ? tile.free_space
                          ? 'bg-[rgba(232,184,75,0.08)] border-[rgba(232,184,75,0.3)]'
                          : tile.is_purple
                            ? 'bg-[rgba(168,117,240,0.08)] border-[rgba(168,117,240,0.3)]'
                            : 'bg-surface border-[rgba(255,255,255,0.08)]'
                        : 'bg-bg3 border-dashed border-[rgba(255,255,255,0.06)]'
                    }`}>
                      {tile ? (
                        <>
                          <img src={tile.sprite_url || w(tile.name)} alt={tile.name}
                            className="w-6 h-6 object-contain" style={{ imageRendering: 'pixelated' }} />
                          <div className="font-pixel text-[4px] text-text-3 mt-0.5 overflow-hidden w-full text-center"
                            style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tile.free_space ? '★' : tile.name.split(' ')[0]}
                          </div>
                          {isOwner && (
                            <form action={removeTile.bind(null, tile.id, eventId)} className="absolute top-0.5 right-0.5">
                              <button className="w-3.5 h-3.5 bg-[rgba(232,85,85,0.3)] hover:bg-[rgba(232,85,85,0.6)] rounded-sm text-[7px] text-red flex items-center justify-center transition-colors">×</button>
                            </form>
                          )}
                        </>
                      ) : (
                        <span className="font-pixel text-[6px] text-text-3">{pos}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {(tiles ?? []).length < 25 && (
                <form action={addTileAction.bind(null, eventId)} className="space-y-3 pt-4 border-t border-[rgba(232,184,75,0.08)]">
                  <p className="font-pixel text-[7px] text-text-3 tracking-wider">ADD TILE</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-text-3 mb-1">Tile Name</label>
                      <input name="name" placeholder="Twisted bow" required
                        className="w-full h-9 px-3 text-sm bg-surface border border-[rgba(232,184,75,0.20)] rounded text-text placeholder:text-text-3 outline-none focus:border-gold-dim transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-3 mb-1">Source / Raid</label>
                      <select name="source_raid"
                        className="w-full h-9 px-3 text-sm bg-surface border border-[rgba(232,184,75,0.20)] rounded text-text outline-none focus:border-gold-dim transition-all">
                        <option value="">None</option>
                        {['CoX','ToB','ToA','Nex','NM','DT2','Inferno','Liz'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-text-3 mb-1">Position (0–24)</label>
                      <input name="position" type="number" min="0" max="24"
                        defaultValue={nextFreePosition >= 0 ? nextFreePosition : ''}
                        required className="w-full h-9 px-3 text-sm bg-surface border border-[rgba(232,184,75,0.20)] rounded text-text outline-none focus:border-gold-dim transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-3 mb-1">Points</label>
                      <input name="points" type="number" min="1" defaultValue="1"
                        className="w-full h-9 px-3 text-sm bg-surface border border-[rgba(232,184,75,0.20)] rounded text-text outline-none focus:border-gold-dim transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-3 mb-1">Sprite URL (optional)</label>
                    <input name="sprite_url" type="url" placeholder="https://..."
                      className="w-full h-9 px-3 text-sm bg-surface border border-[rgba(232,184,75,0.20)] rounded text-text placeholder:text-text-3 outline-none focus:border-gold-dim transition-all" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-text-2 cursor-pointer">
                      <input type="checkbox" name="is_purple" value="true" className="accent-purple" />
                      Purple / Mega-rare
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text-2 cursor-pointer">
                      <input type="checkbox" name="free_space" value="true" className="accent-gold" />
                      Free space
                    </label>
                  </div>
                  <Button type="submit" size="sm" className="w-full">Add Tile</Button>
                </form>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ── TEAMS + MEMBERS ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <span className="font-pixel text-[7px] text-gold tracking-widest">TEAMS</span>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              {(teams ?? []).map((team: any) => (
                <div key={team.id} className="flex items-center gap-3 py-2 px-3 rounded bg-bg3 border border-[rgba(255,255,255,0.04)]">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: team.color }} />
                  <span className="font-syne font-bold text-sm flex-1">{team.name}</span>
                  <span className="font-pixel text-[6px] text-text-3">{team.team_members?.length ?? 0} members</span>
                  {isOwner && (
                    <form action={removeTeam.bind(null, team.id, eventId)}>
                      <button className="text-[10px] text-text-3 hover:text-red transition-colors px-1">✕</button>
                    </form>
                  )}
                </div>
              ))}

              {isOwner && (teams ?? []).length < 8 && (
                <form action={addTeamAction.bind(null, eventId)} className="space-y-2 pt-2 border-t border-[rgba(232,184,75,0.08)]">
                  <p className="font-pixel text-[7px] text-text-3 tracking-wider">ADD TEAM</p>
                  <div className="flex gap-2">
                    <input name="name" placeholder="Team name" required
                      className="flex-1 h-9 px-3 text-sm bg-surface border border-[rgba(232,184,75,0.20)] rounded text-text placeholder:text-text-3 outline-none focus:border-gold-dim transition-all" />
                    <input name="color" type="color" defaultValue="#e8824b"
                      className="h-9 w-12 px-1 bg-surface border border-[rgba(232,184,75,0.20)] rounded cursor-pointer" />
                    <Button type="submit" size="sm">Add</Button>
                  </div>
                </form>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <span className="font-pixel text-[7px] text-gold tracking-widest">MEMBERS & ASSIGNMENTS</span>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-[rgba(232,184,75,0.06)]">
                {(members ?? []).map((member: any) => {
                  const usr = member.users
                  const team = memberTeamMap.get(member.id)
                  const isCurrentUser = usr?.id === user.id

                  return (
                    <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full flex-shrink-0 border flex items-center justify-center font-pixel text-[7px]"
                        style={{
                          background: team ? `${team.color}22` : 'var(--surface2)',
                          borderColor: team ? `${team.color}55` : 'rgba(255,255,255,0.06)',
                          color: team?.color ?? '#4a4438',
                        }}>
                        {usr?.display_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium truncate ${isCurrentUser ? 'text-gold' : 'text-text'}`}>
                            {usr?.display_name}
                          </span>
                          {member.role === 'owner' && <span className="font-pixel text-[5px] text-gold-dim">OWNER</span>}
                          {member.role === 'moderator' && <span className="font-pixel text-[5px] text-[#4b9ef0]">MOD</span>}
                        </div>
                        <span className="text-[10px] text-text-3">{team ? team.name : 'Unassigned'}</span>
                      </div>

                      {isOwner && (
                        <div className="flex items-center gap-2">
                          <form action={assignTeam.bind(null, member.id, eventId)}>
                            <select name="team_id" defaultValue={team?.id ?? ''}
                              className="text-xs bg-surface2 border border-[rgba(232,184,75,0.12)] rounded px-2 py-1.5 text-text-2 outline-none cursor-pointer">
                              <option value="">No team</option>
                              {(teams ?? []).map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                            <Button type="submit" size="sm" variant="ghost" className="text-[10px] px-2 h-8">Set</Button>
                          </form>
                          {member.role !== 'owner' && (
                            <form action={toggleMod.bind(null, member.id, eventId, member.role)}>
                              <button type="submit"
                                className="font-pixel text-[5.5px] px-2 py-1.5 rounded border transition-colors"
                                style={{
                                  background: member.role === 'moderator' ? 'rgba(75,158,240,0.1)' : 'rgba(255,255,255,0.03)',
                                  borderColor: member.role === 'moderator' ? 'rgba(75,158,240,0.25)' : 'rgba(255,255,255,0.08)',
                                  color: member.role === 'moderator' ? '#4b9ef0' : '#4a4438',
                                }}>
                                {member.role === 'moderator' ? 'MOD ✓' : 'MOD'}
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>

          {isOwner && (
            <Card>
              <CardHeader>
                <span className="font-pixel text-[7px] text-gold tracking-widest">DISCORD WEBHOOK</span>
              </CardHeader>
              <CardBody className="p-4">
                <form action={saveWebhook.bind(null, eventId)} className="space-y-3">
                  <input name="webhook_url" type="url"
                    defaultValue={event.discord_webhook_url ?? ''}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full h-10 px-3 text-sm bg-surface border border-[rgba(232,184,75,0.20)] rounded text-text placeholder:text-text-3 outline-none focus:border-gold-dim transition-all"
                  />
                  <p className="text-xs text-text-3">Posts a rich embed to your Discord channel when a tile is approved.</p>
                  <Button type="submit" size="sm" variant="ghost" className="w-full">Save Webhook</Button>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
