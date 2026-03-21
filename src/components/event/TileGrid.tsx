'use client'

import { useState } from 'react'
import { submitCompletion } from '@/app/actions/completions'
import { Button } from '@/components/ui/Button'

const WIKI = 'https://oldschool.runescape.wiki/w/Special:FilePath/'
const W = (n: string) => WIKI + encodeURIComponent(n.replace(/ /g, '_')) + '.png'

const RAID_COLORS: Record<string, string> = {
  CoX:     '#e8b84b',
  ToB:     '#e85555',
  ToA:     '#a875f0',
  Nex:     '#4b9ef0',
  NM:      '#3ecf74',
  DT2:     '#e8824b',
  Inferno: '#ff7755',
  Liz:     '#88dd66',
}

interface TileCompletion {
  id: string
  status: string
  team_id: string
  proof_url: string
}

interface Tile {
  id: string
  name: string
  position: number
  free_space: boolean
  is_purple: boolean
  source_raid: string | null
  sprite_url: string | null
  points: number
  tile_completions: TileCompletion[]
}

interface Team {
  id: string
  name: string
  color: string
}

interface Props {
  tiles: Tile[]
  teams: Team[]
  userTeamId: string | null
  eventId: string
  canSubmit: boolean
}

export function TileGrid({ tiles, teams, userTeamId, eventId, canSubmit }: Props) {
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sort by position
  const sorted = [...tiles].sort((a, b) => a.position - b.position)

  function getTeamCompletion(tile: Tile, teamId: string) {
    return tile.tile_completions?.find(c => c.team_id === teamId)
  }

  function getTileState(tile: Tile): 'free' | 'approved' | 'pending' | 'none' {
    if (tile.free_space) return 'free'
    if (!userTeamId) return 'none'
    const c = getTeamCompletion(tile, userTeamId)
    if (!c) return 'none'
    return c.status as any
  }

  async function handleSubmit() {
    if (!selectedTile || !userTeamId || !proofUrl.trim()) return
    setSubmitting(true)
    setError(null)
    const result = await submitCompletion(selectedTile.id, userTeamId, proofUrl)
    setSubmitting(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSelectedTile(null)
      setProofUrl('')
    }
  }

  return (
    <>
      {/* Board */}
      <div className="px-5 pb-4 flex justify-center">
        <div
          className="grid gap-1.5 w-full"
          style={{ gridTemplateColumns: 'repeat(5, 1fr)', maxWidth: '760px' }}
        >
          {sorted.map(tile => {
            const state = getTileState(tile)
            const approvedTeams = teams.filter(t =>
              tile.tile_completions?.some(c => c.team_id === t.id && c.status === 'approved')
            )
            const pendingTeams = teams.filter(t =>
              tile.tile_completions?.some(c => c.team_id === t.id && c.status === 'pending')
            )

            return (
              <button
                key={tile.id}
                onClick={() => !tile.free_space && setSelectedTile(tile)}
                className={[
                  'aspect-square rounded-lg border flex flex-col items-center justify-center gap-1.5 p-2 relative overflow-hidden transition-all duration-150 cursor-pointer',
                  tile.free_space
                    ? 'bg-[rgba(232,184,75,0.06)] border-[rgba(232,184,75,0.2)] cursor-default'
                    : state === 'approved'
                      ? 'bg-[rgba(62,207,116,0.12)] border-[rgba(62,207,116,0.5)] hover:border-[rgba(62,207,116,0.7)]'
                      : state === 'pending'
                        ? 'bg-[rgba(232,184,75,0.08)] border-[rgba(232,184,75,0.3)] hover:border-[rgba(232,184,75,0.5)]'
                        : tile.is_purple
                          ? 'bg-surface border-[rgba(168,117,240,0.25)] hover:border-[rgba(168,117,240,0.5)] hover:-translate-y-0.5 hover:shadow-lg'
                          : 'bg-bg3 border-[rgba(255,255,255,0.04)] hover:bg-surface hover:border-[rgba(232,184,75,0.20)] hover:-translate-y-0.5 hover:shadow-lg',
                ].join(' ')}
              >
                {/* Top colour bar — approved teams */}
                {approvedTeams.length > 0 && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 flex">
                    {approvedTeams.map(t => (
                      <div key={t.id} className="flex-1" style={{ background: t.color }} />
                    ))}
                  </div>
                )}

                {/* Purple pip */}
                {tile.is_purple && (
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-[1px] bg-purple shadow-[0_0_4px_#a875f0]" />
                )}

                {/* Raid tag */}
                {tile.source_raid && (
                  <div
                    className="absolute top-1 right-1 font-pixel text-[5px] px-1 py-0.5 rounded-[2px]"
                    style={{
                      background: `${RAID_COLORS[tile.source_raid] ?? '#4a4438'}22`,
                      color: RAID_COLORS[tile.source_raid] ?? '#4a4438',
                    }}
                  >
                    {tile.source_raid}
                  </div>
                )}

                {/* State badge */}
                {state === 'approved' && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-green rounded-sm flex items-center justify-center text-[8px] text-bg font-black">
                    ✓
                  </div>
                )}
                {state === 'pending' && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-[rgba(232,184,75,0.8)] rounded-sm flex items-center justify-center text-[8px] text-bg font-black">
                    ?
                  </div>
                )}

                {/* Sprite */}
                {tile.free_space ? (
                  <span className="text-2xl leading-none">⭐</span>
                ) : (
                  <img
                    src={tile.sprite_url || W(tile.name)}
                    alt={tile.name}
                    className={[
                      'w-[55%] h-[55%] object-contain',
                      state === 'none' ? 'grayscale opacity-60 brightness-75' : 'brightness-105',
                    ].join(' ')}
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.1' }}
                  />
                )}

                {/* Name */}
                <div className={[
                  'font-pixel text-[5px] text-center leading-tight px-0.5 w-full overflow-hidden',
                  tile.free_space ? 'text-gold' : state === 'approved' ? 'text-green' : 'text-text-3',
                ].join(' ')} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tile.free_space ? 'FREE' : tile.name}
                </div>

                {/* Pending team dots */}
                {pendingTeams.length > 0 && (
                  <div className="absolute bottom-1 left-1 flex gap-0.5">
                    {pendingTeams.map(t => (
                      <div key={t.id} className="w-1.5 h-1.5 rounded-full border border-bg" style={{ background: t.color }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Submit proof modal */}
      {selectedTile && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedTile(null)}
        >
          <div className="bg-bg2 border border-[rgba(232,184,75,0.25)] rounded-xl w-full max-w-md shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(232,184,75,0.10)]">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {selectedTile.source_raid && (
                    <span className="font-pixel text-[6px]" style={{ color: RAID_COLORS[selectedTile.source_raid] }}>
                      {selectedTile.source_raid}
                    </span>
                  )}
                  {selectedTile.is_purple && (
                    <span className="font-pixel text-[6px] text-purple">⬥ PURPLE</span>
                  )}
                </div>
                <h3 className="font-syne font-extrabold text-lg tracking-tight">{selectedTile.name}</h3>
              </div>
              <button onClick={() => setSelectedTile(null)} className="text-text-3 hover:text-text transition-colors w-7 h-7 flex items-center justify-center rounded border border-[rgba(255,255,255,0.08)] hover:border-[rgba(232,184,75,0.20)]">
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Large sprite */}
              <div className="flex justify-center mb-5">
                <div className={[
                  'w-24 h-24 rounded-xl border flex items-center justify-center',
                  selectedTile.is_purple
                    ? 'bg-[rgba(168,117,240,0.1)] border-[rgba(168,117,240,0.3)] shadow-[0_0_24px_rgba(168,117,240,0.15)]'
                    : 'bg-surface border-[rgba(232,184,75,0.15)]',
                ].join(' ')}>
                  <img
                    src={selectedTile.sprite_url || W(selectedTile.name)}
                    alt={selectedTile.name}
                    className="w-16 h-16 object-contain"
                    style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9))' }}
                  />
                </div>
              </div>

              {/* Team info */}
              {!userTeamId ? (
                <div className="text-center text-text-2 text-sm mb-4">
                  You need to be assigned to a team to submit proof.
                </div>
              ) : canSubmit ? (
                <div className="space-y-4">
                  <div>
                    <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">
                      Proof URL
                    </label>
                    <input
                      type="url"
                      value={proofUrl}
                      onChange={e => setProofUrl(e.target.value)}
                      placeholder="https://imgur.com/... or Discord CDN link"
                      className="w-full h-11 px-4 rounded bg-surface border border-[rgba(232,184,75,0.20)] text-text text-sm placeholder:text-text-3 outline-none focus:border-gold-dim transition-all"
                    />
                    <p className="mt-1.5 text-xs text-text-3">Paste an Imgur, Discord CDN, or any public image URL</p>
                  </div>

                  {error && (
                    <p className="text-sm text-red">{error}</p>
                  )}

                  <div className="flex gap-2.5">
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setSelectedTile(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      loading={submitting}
                      onClick={handleSubmit}
                      disabled={!proofUrl.trim()}
                    >
                      Submit Proof
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-text-2 text-sm">
                  This event is not currently live.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
