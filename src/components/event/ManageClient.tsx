'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppNav } from '@/components/ui/AppNav'
import {
  loadTemplate, removeTile, addTileAction,
  addTeamAction, removeTeam, assignTeam, toggleMod, saveWebhook,
  goLive, endEvent,
} from '@/app/actions/forms'
import { deleteEventVoid } from '@/app/actions/deleteEvent'

// ── OSRS catalogue ────────────────────────────────────────────────────────────
const WIKI = 'https://oldschool.runescape.wiki/w/Special:FilePath/'
const W = (n: string) => `${WIKI}${encodeURIComponent(n.replace(/ /g, '_'))}.png`

const OSRS_ITEMS = [
  { name: 'Twisted bow',            source: 'CoX',     purple: true,  sprite: W('Twisted bow') },
  { name: 'Scythe of vitur',        source: 'ToB',     purple: true,  sprite: W('Scythe of vitur') },
  { name: "Tumeken's shadow",       source: 'ToA',     purple: true,  sprite: W("Tumeken's shadow") },
  { name: 'Ghrazi rapier',          source: 'ToB',     purple: true,  sprite: W('Ghrazi rapier') },
  { name: "Osmumten's fang",        source: 'ToA',     purple: true,  sprite: W("Osmumten's fang") },
  { name: 'Kodai wand',             source: 'CoX',     purple: false, sprite: W('Kodai wand') },
  { name: 'Elder maul',             source: 'CoX',     purple: false, sprite: W('Elder maul') },
  { name: 'Avernic hilt',           source: 'ToB',     purple: false, sprite: W('Avernic defender hilt') },
  { name: 'Zaryte crossbow',        source: 'Nex',     purple: false, sprite: W('Zaryte crossbow') },
  { name: 'Sanguinesti staff',      source: 'ToB',     purple: false, sprite: W('Sanguinesti staff') },
  { name: 'Dragon hunter crossbow', source: 'CoX',     purple: false, sprite: W('Dragon hunter crossbow') },
  { name: 'Justiciar faceguard',    source: 'ToB',     purple: false, sprite: W('Justiciar faceguard') },
  { name: "Elidinis' ward",         source: 'ToA',     purple: false, sprite: W("Elidinis' ward (f)") },
  { name: 'Lightbearer',            source: 'ToA',     purple: false, sprite: W('Lightbearer') },
  { name: 'Olmlet',                 source: 'CoX',     purple: true,  sprite: W('Olmlet') },
  { name: 'Magus ring',             source: 'DT2',     purple: true,  sprite: W('Magus ring') },
  { name: "Inquisitor's mace",      source: 'NM',      purple: false, sprite: W("Inquisitor's mace") },
  { name: 'Dragon warhammer',       source: 'Liz',     purple: false, sprite: W('Dragon warhammer') },
  { name: 'Infernal cape',          source: 'Inferno', purple: true,  sprite: W('Infernal cape') },
  { name: "Lil' Zik",               source: 'ToB',     purple: true,  sprite: W("Lil' zik") },
  { name: 'Jal-nib-rek',            source: 'Inferno', purple: true,  sprite: W('Jal-nib-rek') },
  { name: 'Nightmare staff',        source: 'NM',      purple: true,  sprite: W('Nightmare staff') },
  { name: 'Ancestral robe top',     source: 'CoX',     purple: false, sprite: W('Ancestral robe top') },
  { name: 'Blood torva',            source: 'Nex',     purple: true,  sprite: W('Ancient blood ornament kit') },
  { name: 'Ancestral robe bottom',  source: 'CoX',     purple: false, sprite: W('Ancestral robe bottom') },
  { name: 'Ancestral hat',          source: 'CoX',     purple: false, sprite: W('Ancestral hat') },
  { name: 'Dexterous prayer scroll',source: 'CoX',     purple: false, sprite: W('Dexterous prayer scroll') },
  { name: 'Arcane prayer scroll',   source: 'CoX',     purple: false, sprite: W('Arcane prayer scroll') },
  { name: "Dinh's bulwark",         source: 'CoX',     purple: false, sprite: W("Dinh's bulwark") },
  { name: 'Dragon hunter lance',    source: 'CoX',     purple: false, sprite: W('Dragon hunter lance') },
  { name: 'Dragon claws',           source: 'CoX',     purple: false, sprite: W('Dragon claws') },
  { name: 'Justiciar legguards',    source: 'ToB',     purple: false, sprite: W('Justiciar legguards') },
  { name: 'Justiciar chestguard',   source: 'ToB',     purple: false, sprite: W('Justiciar chestguard') },
  { name: 'Avernic defender',       source: 'ToB',     purple: false, sprite: W('Avernic defender') },
  { name: 'Torva full helm',        source: 'Nex',     purple: false, sprite: W('Torva full helm') },
  { name: 'Torva platebody',        source: 'Nex',     purple: false, sprite: W('Torva platebody') },
  { name: 'Torva platelegs',        source: 'Nex',     purple: false, sprite: W('Torva platelegs') },
  { name: 'Bellator ring',          source: 'DT2',     purple: true,  sprite: W('Bellator ring') },
  { name: 'Venator ring',           source: 'DT2',     purple: true,  sprite: W('Venator ring') },
  { name: 'Ultor ring',             source: 'DT2',     purple: true,  sprite: W('Ultor ring') },
  { name: "Inquisitor's great helm",source: 'NM',      purple: false, sprite: W("Inquisitor's great helm") },
  { name: "Inquisitor's hauberk",   source: 'NM',      purple: false, sprite: W("Inquisitor's hauberk") },
  { name: "Inquisitor's plateskirt",source: 'NM',      purple: false, sprite: W("Inquisitor's plateskirt") },
  { name: 'Volatile orb',           source: 'NM',      purple: true,  sprite: W('Volatile orb') },
  { name: 'Harmonised orb',         source: 'NM',      purple: true,  sprite: W('Harmonised orb') },
  { name: 'Eldritch orb',           source: 'NM',      purple: true,  sprite: W('Eldritch orb') },
  { name: 'Masori mask',            source: 'ToA',     purple: false, sprite: W('Masori mask') },
  { name: 'Masori body',            source: 'ToA',     purple: false, sprite: W('Masori body (f)') },
  { name: 'Masori chaps',           source: 'ToA',     purple: false, sprite: W('Masori chaps (f)') },
  { name: 'Bandos chestplate',      source: 'GWD',     purple: false, sprite: W('Bandos chestplate') },
  { name: 'Bandos tassets',         source: 'GWD',     purple: false, sprite: W('Bandos tassets') },
  { name: 'Armadyl helmet',         source: 'GWD',     purple: false, sprite: W('Armadyl helmet') },
  { name: 'Armadyl chestplate',     source: 'GWD',     purple: false, sprite: W('Armadyl chestplate') },
  { name: 'Armadyl chainskirt',     source: 'GWD',     purple: false, sprite: W('Armadyl chainskirt') },
  { name: 'Pet general graardor',   source: 'GWD',     purple: true,  sprite: W('Pet general graardor') },
  { name: "Pet kree'arra",          source: 'GWD',     purple: true,  sprite: W("Pet kree'arra") },
  { name: 'Abyssal whip',           source: 'Slayer',  purple: false, sprite: W('Abyssal whip') },
  { name: 'Abyssal dagger',         source: 'Slayer',  purple: false, sprite: W('Abyssal dagger') },
  { name: 'Trident of the seas',    source: 'Slayer',  purple: false, sprite: W('Trident of the seas') },
  { name: 'Occult necklace',        source: 'Slayer',  purple: false, sprite: W('Occult necklace') },
  { name: 'Tanzanite fang',         source: 'Slayer',  purple: false, sprite: W('Tanzanite fang') },
]

const TEAM_COLORS = ['#e8824b','#4b9ef0','#3ecf74','#a875f0','#e8b84b','#e85555','#4bd4e8','#f0c85a']
const RAIDS = ['CoX','ToB','ToA','Nex','NM','DT2','Inferno','Liz','GWD','Slayer','Other']

// ── Shared style helpers ──────────────────────────────────────────────────────
const input: React.CSSProperties = {
  width: '100%', height: '44px', padding: '0 14px',
  background: 'var(--bg3)', border: '1px solid rgba(232,184,75,0.2)',
  borderRadius: '8px', color: 'var(--text)', fontSize: '14px',
  outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border .15s',
}
const label: React.CSSProperties = {
  display: 'block', fontFamily: "'Press Start 2P',monospace",
  fontSize: '7px', color: '#4a4438', letterSpacing: '1.5px', marginBottom: '8px',
}
const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.10)',
  borderRadius: '14px', overflow: 'hidden',
}
function btn(variant: 'gold'|'ghost'|'danger'|'neutral' = 'ghost'): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all .15s', border: 'none',
  }
  if (variant === 'gold')    return { ...base, background: '#e8b84b', color: '#0c0a08', boxShadow: '0 0 20px rgba(232,184,75,0.2)' }
  if (variant === 'ghost')   return { ...base, background: 'none', border: '1px solid rgba(232,184,75,0.2)', color: '#9a8f7a' }
  if (variant === 'danger')  return { ...base, background: 'rgba(232,85,85,0.08)', border: '1px solid rgba(232,85,85,0.25)', color: '#e85555' }
  return { ...base, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.06)', color: '#9a8f7a' }
}

// ── ItemSearchDropdown ────────────────────────────────────────────────────────
type OsrsItem = typeof OSRS_ITEMS[0]

function ItemSearchDropdown({ onSelect, existingNames, boardTiles }: {
  onSelect: (item: OsrsItem) => void
  existingNames: string[]
  boardTiles: any[]
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<OsrsItem | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Merge catalogue with already-used custom tiles on this board
  const customTilesOnBoard = boardTiles
    .filter(t => !t.free_space && !OSRS_ITEMS.find(i => i.name === t.name))
    .map(t => ({ name: t.name, source: t.source_raid ?? '', purple: t.is_purple, sprite: t.sprite_url ?? W(t.name) }))

  const allItems = [...OSRS_ITEMS, ...customTilesOnBoard]

  const filtered = query.length < 1
    ? allItems.slice(0, 12)
    : allItems.filter(i =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.source.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)

  function pick(item: OsrsItem) {
    setSelected(item); setQuery(item.name); setOpen(false); onSelect(item)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(true)} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        height: '44px', padding: '0 14px',
        background: 'var(--bg3)',
        border: `1px solid ${open ? 'rgba(232,184,75,0.5)' : 'rgba(232,184,75,0.2)'}`,
        borderRadius: '8px', cursor: 'text',
      }}>
        {selected?.sprite && (
          <img src={selected.sprite} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
        )}
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) setSelected(null) }}
          onFocus={() => setOpen(true)}
          placeholder="Search items… e.g. Twisted bow, CoX, purple"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '14px', fontFamily: "'DM Sans',sans-serif" }}
        />
        {selected && (
          <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', padding: '3px 8px', borderRadius: '4px', background: selected.purple ? 'rgba(168,117,240,0.12)' : 'rgba(232,184,75,0.08)', color: selected.purple ? '#a875f0' : '#9a8f7a', border: `1px solid ${selected.purple ? 'rgba(168,117,240,0.25)' : 'rgba(232,184,75,0.15)'}`, whiteSpace: 'nowrap', flexShrink: 0 }}>{selected.source || 'CUSTOM'}</span>
        )}
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid rgba(232,184,75,0.18)', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.8)', zIndex: 300, maxHeight: '320px', overflowY: 'auto' }}>
          {!query && <div style={{ padding: '10px 14px 6px', fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', letterSpacing: '1px' }}>POPULAR ITEMS</div>}
          {filtered.map((item, i) => {
            const used = existingNames.includes(item.name)
            const isOnBoard = boardTiles.find(t => t.name === item.name)
            return (
              <div key={i} onClick={() => !used && pick(item)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: used ? 'default' : 'pointer', opacity: used ? 0.4 : 1, borderBottom: '1px solid rgba(232,184,75,0.04)', transition: 'background .1s' }}
                onMouseEnter={e => { if (!used) (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
                {item.sprite ? (
                  <img src={item.sprite} alt={item.name} style={{ width: '32px', height: '32px', objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div style={{ width: '32px', height: '32px', background: 'rgba(232,184,75,0.06)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>⭐</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: used ? '#4a4438' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  {item.source && <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', marginTop: '2px' }}>{item.source}</div>}
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                  {item.purple && <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#a875f0', padding: '2px 6px', borderRadius: '3px', background: 'rgba(168,117,240,0.1)', border: '1px solid rgba(168,117,240,0.2)' }}>PURPLE</span>}
                  {used && <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438' }}>ON BOARD</span>}
                  {isOnBoard && !used && <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4b9ef0', padding: '2px 6px', borderRadius: '3px', background: 'rgba(75,158,240,0.08)', border: '1px solid rgba(75,158,240,0.15)' }}>USED</span>}
                </div>
              </div>
            )
          })}
          {query && !allItems.find(i => i.name.toLowerCase() === query.toLowerCase()) && (
            <div onClick={() => pick({ name: query, source: '', purple: false, sprite: W(query) })}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', cursor: 'pointer', borderTop: '1px solid rgba(232,184,75,0.08)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(232,184,75,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>+</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: '#e8b84b' }}>Add "{query}" as custom tile</div>
                <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', marginTop: '2px' }}>CUSTOM ITEM · OSRS wiki sprite will be used</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── AddTilePanel ──────────────────────────────────────────────────────────────
function AddTilePanel({ position, eventId, existingNames, boardTiles, onClose, onDone }: {
  position: number; eventId: string; existingNames: string[]; boardTiles: any[]; onClose: () => void; onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [selectedItem, setSelectedItem] = useState<OsrsItem | null>(null)
  const [isFree, setIsFree] = useState(false)
  const [isPurple, setIsPurple] = useState(false)
  const [source, setSource] = useState('')

  function handleSelect(item: OsrsItem) {
    setSelectedItem(item); setIsPurple(item.purple); setSource(item.source)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('position', String(position))
    if (isFree) { fd.set('name', 'FREE'); fd.set('free_space', 'true') }
    else {
      if (!selectedItem) return
      fd.set('name', selectedItem.name)
      if (selectedItem.sprite) fd.set('sprite_url', selectedItem.sprite)
    }
    startTransition(async () => { await addTileAction(eventId, fd); onDone() })
  }

  return (
    <div style={{ background: 'var(--bg2)', borderLeft: '1px solid rgba(232,184,75,0.12)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(232,184,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 10 }}>
        <div>
          <div style={label}>ADD TILE · POSITION {position}</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '20px', color: 'var(--text)' }}>Choose an Item</div>
        </div>
        <button onClick={onClose} style={{ width: '36px', height: '36px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.12)', borderRadius: '8px', color: '#9a8f7a', cursor: 'pointer', fontSize: '18px' }}>×</button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input type="hidden" name="position" value={position} />
        <input type="hidden" name="is_purple" value={isPurple ? 'true' : 'false'} />
        <input type="hidden" name="source_raid" value={source} />
        <input type="hidden" name="points" value="1" />

        {/* Free space toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '16px', background: isFree ? 'rgba(232,184,75,0.06)' : 'var(--surface)', border: `1px solid ${isFree ? 'rgba(232,184,75,0.3)' : 'rgba(232,184,75,0.1)'}`, borderRadius: '12px', transition: 'all .15s' }}>
          <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} style={{ accentColor: '#e8b84b', width: '18px', height: '18px', flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '15px', color: isFree ? '#e8b84b' : 'var(--text)' }}>⭐ Free Space</div>
            <div style={{ fontSize: '13px', color: '#9a8f7a', marginTop: '2px' }}>Always completed for all teams</div>
          </div>
        </label>

        {!isFree && (
          <>
            <div>
              <div style={label}>SEARCH ITEM</div>
              <ItemSearchDropdown onSelect={handleSelect} existingNames={existingNames} boardTiles={boardTiles} />
            </div>

            {selectedItem && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: isPurple ? 'rgba(168,117,240,0.06)' : 'var(--surface)', border: `2px solid ${isPurple ? 'rgba(168,117,240,0.3)' : 'rgba(232,184,75,0.12)'}`, borderRadius: '12px' }}>
                <img src={selectedItem.sprite} alt={selectedItem.name} style={{ width: '56px', height: '56px', objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: isPurple ? '#a875f0' : 'var(--text)', marginBottom: '3px' }}>{selectedItem.name}</div>
                  {source && <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438' }}>{source}</div>}
                </div>
                {isPurple && <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#a875f0', boxShadow: '0 0 8px #a875f0', flexShrink: 0 }} />}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={label}>SOURCE / RAID</div>
                <select value={source} onChange={e => setSource(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
                  <option value="">None</option>
                  {RAIDS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <div style={label}>POINTS</div>
                <input name="points" type="number" min="1" defaultValue="1" style={input} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', padding: '16px', background: isPurple ? 'rgba(168,117,240,0.06)' : 'var(--surface)', border: `1px solid ${isPurple ? 'rgba(168,117,240,0.25)' : 'rgba(232,184,75,0.1)'}`, borderRadius: '12px', transition: 'all .15s' }}>
              <input type="checkbox" checked={isPurple} onChange={e => setIsPurple(e.target.checked)} style={{ accentColor: '#a875f0', width: '18px', height: '18px', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '15px', color: isPurple ? '#a875f0' : 'var(--text)' }}>⬥ Purple / Mega-rare Drop</div>
                <div style={{ fontSize: '13px', color: '#9a8f7a', marginTop: '2px' }}>Highlighted with purple glow on board</div>
              </div>
            </label>
          </>
        )}

        <button type="submit" disabled={pending || (!isFree && !selectedItem)}
          style={{ ...btn('gold'), width: '100%', padding: '14px', fontSize: '15px', opacity: (!isFree && !selectedItem) ? 0.4 : 1, cursor: (!isFree && !selectedItem) ? 'not-allowed' : 'pointer' }}>
          {pending ? 'Adding…' : `Add Tile to Position ${position}`}
        </button>
      </form>
    </div>
  )
}

// ── BoardTab ──────────────────────────────────────────────────────────────────
function BoardTab({ tiles, eventId, isOwner }: { tiles: any[]; eventId: string; isOwner: boolean }) {
  const [selectedPos, setSelectedPos] = useState<number | null>(null)
  const [removing, startRemove] = useTransition()
  const [loadingTpl, startLoadTpl] = useTransition()
  const router = useRouter()

  const tileMap = new Map(tiles.map(t => [t.position, t]))
  const existingNames = tiles.filter(t => !t.free_space).map(t => t.name)

  function handleRemove(tileId: string, e: React.MouseEvent) {
    e.stopPropagation()
    startRemove(async () => { await removeTile(tileId, eventId); router.refresh() })
  }

  function handleDone() { setSelectedPos(null); router.refresh() }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedPos !== null ? '1fr 400px' : '1fr', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ overflowY: 'auto', padding: '32px 40px', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px' }}>
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px', color: 'var(--text)', marginBottom: '6px' }}>Bingo Board</h2>
            <p style={{ fontSize: '14px', color: '#9a8f7a' }}>{tiles.length}/25 tiles placed · Click an empty cell to add a tile</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            {isOwner && tiles.length === 0 && (
              <button onClick={() => startLoadTpl(async () => { await loadTemplate(eventId); router.refresh() })} disabled={loadingTpl}
                style={{ ...btn('ghost') }}>
                {loadingTpl ? 'Loading…' : '⚡ Load OSRS Template'}
              </button>
            )}
            {tiles.length > 0 && tiles.length < 25 && (
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#4a4438', padding: '10px 14px', border: '1px solid rgba(232,184,75,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                {25 - tiles.length} SLOTS OPEN
              </div>
            )}
          </div>
        </div>

        {/* 5×5 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px', maxWidth: '540px' }}>
          {Array.from({ length: 25 }, (_, pos) => {
            const tile = tileMap.get(pos)
            const isSelected = selectedPos === pos
            const isEmpty = !tile
            return (
              <div key={pos}
                onClick={() => isEmpty && isOwner && setSelectedPos(pos === selectedPos ? null : pos)}
                style={{
                  aspectRatio: '1', borderRadius: '10px', position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '4px', padding: '8px 4px 6px', overflow: 'hidden',
                  cursor: tile ? 'default' : isOwner ? 'pointer' : 'default', transition: 'all .15s',
                  background: tile?.free_space ? 'rgba(232,184,75,0.06)' : tile?.is_purple ? 'rgba(168,117,240,0.08)' : tile ? 'var(--surface)' : isSelected ? 'rgba(232,184,75,0.08)' : 'var(--bg3)',
                  border: tile?.free_space ? '1px solid rgba(232,184,75,0.3)' : tile?.is_purple ? '1px solid rgba(168,117,240,0.3)' : tile ? '1px solid rgba(255,255,255,0.06)' : isSelected ? '2px dashed rgba(232,184,75,0.6)' : '1px dashed rgba(255,255,255,0.06)',
                  boxShadow: isSelected ? '0 0 0 3px rgba(232,184,75,0.15)' : 'none',
                }}>
                {tile ? (
                  <>
                    {tile.is_purple && <div style={{ position: 'absolute', top: '4px', left: '4px', width: '5px', height: '5px', background: '#a875f0', borderRadius: '1px', boxShadow: '0 0 4px #a875f0' }} />}
                    {tile.source_raid && (
                      <div style={{ position: 'absolute', top: '3px', right: '3px', fontFamily: "'Press Start 2P',monospace", fontSize: '4px', color: '#4a4438', padding: '1px 3px' }}>{tile.source_raid}</div>
                    )}
                    {tile.sprite_url ? (
                      <img src={tile.sprite_url} alt={tile.name} style={{ width: '50%', height: '50%', objectFit: 'contain', imageRendering: 'pixelated' }} onError={e => (e.currentTarget.style.display = 'none')} />
                    ) : tile.free_space ? (
                      <span style={{ fontSize: '20px' }}>⭐</span>
                    ) : null}
                    <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5px', color: tile.free_space ? '#e8b84b' : '#9a8f7a', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                      {tile.free_space ? 'FREE' : tile.name.split(' ').slice(0, 2).join(' ')}
                    </div>
                    {isOwner && (
                      <button onClick={e => handleRemove(tile.id, e)} disabled={removing}
                        style={{ position: 'absolute', top: '3px', right: tile.source_raid ? '24px' : '3px', width: '16px', height: '16px', background: 'rgba(232,85,85,0.8)', border: 'none', borderRadius: '4px', color: 'white', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                        ×
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: isSelected ? '8px' : '6px', color: isSelected ? '#e8b84b' : '#4a4438' }}>
                      {isSelected ? '+ ADD' : pos}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {tiles.length === 0 && (
          <div style={{ marginTop: '32px', padding: '40px', background: 'var(--surface)', border: '1px dashed rgba(232,184,75,0.15)', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>Board is empty</div>
            <p style={{ color: '#9a8f7a', fontSize: '14px', marginBottom: '24px' }}>Load the OSRS template instantly, or click any cell to build manually.</p>
            {isOwner && (
              <button onClick={() => startLoadTpl(async () => { await loadTemplate(eventId); router.refresh() })} disabled={loadingTpl}
                style={{ ...btn('gold'), padding: '14px 32px', fontSize: '15px' }}>
                {loadingTpl ? 'Loading…' : '⚡ Load OSRS Template'}
              </button>
            )}
          </div>
        )}
      </div>

      {selectedPos !== null && isOwner && (
        <AddTilePanel position={selectedPos} eventId={eventId} existingNames={existingNames} boardTiles={tiles} onClose={() => setSelectedPos(null)} onDone={handleDone} />
      )}
    </div>
  )
}

// ── TeamsTab ──────────────────────────────────────────────────────────────────
function TeamsTab({ teams, members, eventId, isOwner }: { teams: any[]; members: any[]; eventId: string; isOwner: boolean }) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [color, setColor] = useState(TEAM_COLORS[teams.length % TEAM_COLORS.length])
  const router = useRouter()

  const memberTeamMap = new Map<string, any>()
  teams.forEach(t => t.team_members?.forEach((tm: any) => { if (tm.event_members?.id) memberTeamMap.set(tm.event_members.id, t) }))

  const unassigned = members.filter(m => !memberTeamMap.has(m.id))

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const fd = new FormData(); fd.set('name', name); fd.set('color', color)
    startTransition(async () => { await addTeamAction(eventId, fd); setName(''); router.refresh() })
  }

  function handleRemove(teamId: string) {
    if (!confirm('Remove this team? Members will be unassigned.')) return
    startTransition(async () => { await removeTeam(teamId, eventId); router.refresh() })
  }

  function handleAssign(memberId: string, teamId: string) {
    const fd = new FormData(); fd.set('team_id', teamId)
    startTransition(async () => { await assignTeam(memberId, eventId, fd); router.refresh() })
  }

  return (
    <div style={{ overflowY: 'auto', padding: '32px 40px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px', color: 'var(--text)', marginBottom: '6px' }}>Teams</h2>
          <p style={{ fontSize: '14px', color: '#9a8f7a' }}>{teams.length} team{teams.length !== 1 ? 's' : ''} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {teams.map(team => {
          const teamMembers = members.filter(m => memberTeamMap.get(m.id)?.id === team.id)
          return (
            <div key={team.id} style={{ ...card }}>
              <div style={{ height: '4px', background: team.color }} />
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: team.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '18px', color: 'var(--text)', flex: 1 }}>{team.name}</span>
                  <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438' }}>{teamMembers.length} MEMBERS</span>
                  {isOwner && (
                    <button onClick={() => handleRemove(team.id)} style={{ background: 'none', border: 'none', color: '#4a4438', cursor: 'pointer', fontSize: '14px', padding: '4px 6px', borderRadius: '6px', transition: 'all .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e85555' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a4438' }}>✕</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {teamMembers.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#4a4438', fontStyle: 'italic', padding: '6px 0' }}>No members yet</div>
                  ) : teamMembers.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `${team.color}22`, border: `1px solid ${team.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: team.color, flexShrink: 0 }}>
                        {m.users?.display_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', flex: 1 }}>{m.users?.display_name}</span>
                      {m.role === 'owner' && <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '5px', color: '#7a5c1e' }}>OWNER</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {unassigned.length > 0 && (
          <div style={{ ...card }}>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ padding: '20px' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '16px', color: '#9a8f7a', marginBottom: '14px' }}>Unassigned · {unassigned.length}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {unassigned.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color: '#4a4438', flexShrink: 0 }}>
                      {m.users?.display_name?.substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#9a8f7a', flex: 1 }}>{m.users?.display_name}</span>
                    {isOwner && teams.length > 0 && (
                      <select defaultValue="" onChange={e => e.target.value && handleAssign(m.id, e.target.value)}
                        style={{ background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.15)', borderRadius: '6px', color: '#9a8f7a', fontSize: '12px', padding: '5px 10px', cursor: 'pointer', outline: 'none' }}>
                        <option value="" disabled>Assign…</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isOwner && teams.length < 8 && (
        <div style={{ ...card }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(232,184,75,0.08)' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '18px', color: 'var(--text)' }}>Create Team</div>
          </div>
          <form onSubmit={handleAdd} style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={label}>TEAM NAME</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bandos Boys" required style={input} />
            </div>
            <div>
              <div style={label}>COLOUR</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {TEAM_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)} style={{ width: '36px', height: '36px', borderRadius: '8px', background: c, border: color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', transition: 'border .1s', flexShrink: 0 }} />
                ))}
              </div>
            </div>
            <button type="submit" disabled={pending} style={{ ...btn('gold'), whiteSpace: 'nowrap', height: '44px' }}>
              {pending ? 'Adding…' : '+ Create Team'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ── MembersTab ────────────────────────────────────────────────────────────────
function MembersTab({ members, teams, eventId, isOwner, currentUserId }: { members: any[]; teams: any[]; eventId: string; isOwner: boolean; currentUserId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const memberTeamMap = new Map<string, any>()
  teams.forEach(t => t.team_members?.forEach((tm: any) => { if (tm.event_members?.id) memberTeamMap.set(tm.event_members.id, t) }))

  function handleAssign(memberId: string, teamId: string) {
    const fd = new FormData(); fd.set('team_id', teamId)
    startTransition(async () => { await assignTeam(memberId, eventId, fd); router.refresh() })
  }

  function handleToggle(memberId: string, role: string) {
    startTransition(async () => { await toggleMod(memberId, eventId, role); router.refresh() })
  }

  return (
    <div style={{ overflowY: 'auto', padding: '32px 40px', height: '100%' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px', color: 'var(--text)', marginBottom: '6px' }}>Members</h2>
        <p style={{ fontSize: '14px', color: '#9a8f7a' }}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </div>
      <div style={{ ...card }}>
        {members.map((m, i) => {
          const usr = m.users
          const team = memberTeamMap.get(m.id)
          const isMe = usr?.id === currentUserId
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: i < members.length - 1 ? '1px solid rgba(232,184,75,0.06)' : 'none' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: team ? `${team.color}22` : 'var(--surface2)', border: `2px solid ${team ? team.color + '55' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: team?.color ?? '#4a4438', flexShrink: 0 }}>
                {usr?.display_name?.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '16px', color: isMe ? '#e8b84b' : 'var(--text)' }}>{usr?.display_name}</span>
                  {m.role === 'owner' && <Tag label="OWNER" color="#7a5c1e" bg="rgba(232,184,75,0.08)" border="rgba(232,184,75,0.2)" />}
                  {m.role === 'moderator' && <Tag label="MOD" color="#4b9ef0" bg="rgba(75,158,240,0.08)" border="rgba(75,158,240,0.2)" />}
                  {isMe && <Tag label="YOU" color="#4a4438" bg="transparent" border="transparent" />}
                </div>
                <div style={{ fontSize: '13px', color: '#9a8f7a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {team ? <><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: team.color, display: 'inline-block', flexShrink: 0 }} />{team.name}</> : 'Unassigned'}
                </div>
              </div>
              {isOwner && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={team?.id ?? ''} onChange={e => handleAssign(m.id, e.target.value)}
                    style={{ background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.15)', borderRadius: '8px', color: '#9a8f7a', fontSize: '13px', padding: '8px 12px', cursor: 'pointer', outline: 'none', height: '40px' }}>
                    <option value="">No team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {m.role !== 'owner' && (
                    <button onClick={() => handleToggle(m.id, m.role)} disabled={pending}
                      style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', height: '40px', padding: '0 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all .15s', border: '1px solid', background: m.role === 'moderator' ? 'rgba(75,158,240,0.1)' : 'var(--surface)', borderColor: m.role === 'moderator' ? 'rgba(75,158,240,0.3)' : 'rgba(255,255,255,0.08)', color: m.role === 'moderator' ? '#4b9ef0' : '#4a4438' }}>
                      {m.role === 'moderator' ? 'MOD ✓' : 'MOD'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── SettingsTab ───────────────────────────────────────────────────────────────
function SettingsTab({ event, eventId, isOwner }: { event: any; eventId: string; isOwner: boolean }) {
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [webhook, setWebhook] = useState(event.discord_webhook_url ?? '')
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(); fd.set('webhook_url', webhook)
    startTransition(async () => { await saveWebhook(eventId, fd); setSaved(true); setTimeout(() => setSaved(false), 2500) })
  }

  function handleGoLive() {
    startTransition(async () => { await goLive(eventId); router.refresh() })
  }

  function handleEnd() {
    if (!confirm('End this event? Tile submissions will be closed.')) return
    startTransition(async () => { await endEvent(eventId); router.refresh() })
  }

  function handleDelete() {
    if (!confirm(`Delete "${event.name}"?\n\nThis cannot be undone. All tiles, teams, members and submissions will be permanently removed.`)) return
    startDelete(async () => { await deleteEventVoid(eventId) })
  }

  const statusColor = { live: '#3ecf74', draft: '#9a8f7a', ended: '#4a4438' }[event.status as string] ?? '#9a8f7a'
  const statusLabel = event.status?.toUpperCase() ?? 'DRAFT'

  return (
    <div style={{ overflowY: 'auto', padding: '32px 40px', height: '100%' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px', color: 'var(--text)', marginBottom: '6px' }}>Settings</h2>
        <p style={{ fontSize: '14px', color: '#9a8f7a' }}>Event configuration and controls</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
        {/* Status */}
        <div style={{ ...card }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(232,184,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: 'var(--text)' }}>Event Status</div>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', padding: '5px 12px', borderRadius: '5px', background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40` }}>{statusLabel}</div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: '14px', color: '#9a8f7a', marginBottom: '16px', lineHeight: 1.6 }}>
              {event.status === 'draft' && 'Event is in draft mode. Members can join but cannot submit tile proofs until you go live.'}
              {event.status === 'live' && 'Event is live. Members can submit proof for completed tiles.'}
              {event.status === 'ended' && 'Event has ended. No further submissions are accepted.'}
            </p>
            {isOwner && event.status === 'draft' && (
              <button onClick={handleGoLive} disabled={pending} style={{ ...btn('gold') }}>🟢 Go Live</button>
            )}
            {isOwner && event.status === 'live' && (
              <button onClick={handleEnd} disabled={pending} style={{ ...btn('ghost') }}>End Event</button>
            )}
          </div>
        </div>

        {/* Invite code */}
        <div style={{ ...card }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(232,184,75,0.08)' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: 'var(--text)' }}>Invite Code</div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '28px', color: '#e8b84b', letterSpacing: '6px', marginBottom: '12px' }}>{event.invite_code}</div>
            <p style={{ fontSize: '13px', color: '#9a8f7a', marginBottom: '14px' }}>Share this code with your clan. They visit <span style={{ color: '#e8b84b' }}>tilescape.vercel.app/join</span> and enter the code to join.</p>
            <button onClick={() => navigator.clipboard.writeText(`https://tilescape.vercel.app/join?code=${event.invite_code}`)}
              style={{ ...btn('ghost'), fontSize: '13px' }}>
              📋 Copy Join Link
            </button>
          </div>
        </div>

        {/* Webhook */}
        {isOwner && (
          <div style={{ ...card }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(232,184,75,0.08)' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: 'var(--text)' }}>Discord Webhook</div>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px' }}>
              <div style={label}>WEBHOOK URL</div>
              <input type="url" value={webhook} onChange={e => setWebhook(e.target.value)} placeholder="https://discord.com/api/webhooks/…" style={{ ...input, marginBottom: '10px' }} />
              <p style={{ fontSize: '13px', color: '#9a8f7a', marginBottom: '16px' }}>Posts a rich embed to your Discord channel whenever a tile is approved.</p>
              <button type="submit" disabled={pending} style={{ ...btn(saved ? 'ghost' : 'gold') }}>
                {pending ? 'Saving…' : saved ? '✓ Saved!' : 'Save Webhook'}
              </button>
            </form>
          </div>
        )}

        {/* Danger zone */}
        {isOwner && (
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(232,85,85,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(232,85,85,0.1)' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: '#e85555' }}>Danger Zone</div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', color: '#9a8f7a', marginBottom: '16px', lineHeight: 1.6 }}>Permanently delete this event and all associated tiles, teams, members and submissions. This cannot be undone.</p>
              <button onClick={handleDelete} disabled={deleting} style={{ ...btn('danger') }}>
                {deleting ? 'Deleting…' : '🗑 Delete Event Permanently'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tag helper ────────────────────────────────────────────────────────────────
function Tag({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6px', color, padding: '3px 8px', borderRadius: '4px', background: bg, border: `1px solid ${border}` }}>{label}</span>
  )
}

// ── Main ManageClient ─────────────────────────────────────────────────────────
const TABS = ['Board', 'Teams', 'Members', 'Settings'] as const
type Tab = typeof TABS[number]

interface Props {
  event: any; tiles: any[]; teams: any[]; members: any[]
  isOwner: boolean; currentUserId: string
}

export function ManageClient({ event, tiles, teams, members, isOwner, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>('Board')
  const displayName = members.find(m => m.users?.id === currentUserId)?.users?.display_name ?? ''

  const navContext = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Link href={`/events/${event.id}`} style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none', transition: 'color .15s' }}>← Board</Link>
      <span style={{ color: '#4a4438' }}>/</span>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{event.name}</span>
      <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', padding: '3px 8px', borderRadius: '3px', background: event.status === 'live' ? 'rgba(62,207,116,0.1)' : 'rgba(154,143,122,0.08)', color: event.status === 'live' ? '#3ecf74' : '#9a8f7a', border: `1px solid ${event.status === 'live' ? 'rgba(62,207,116,0.25)' : 'rgba(154,143,122,0.15)'}` }}>
        {event.status?.toUpperCase()}
      </div>
    </div>
  )

  const navActions = (
    <Link href={`/events/${event.id}`} style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '13px', padding: '8px 16px', borderRadius: '8px', background: 'none', border: '1px solid rgba(232,184,75,0.2)', color: '#9a8f7a', textDecoration: 'none', transition: 'all .15s' }}>
      View Board
    </Link>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', fontFamily: "'DM Sans',sans-serif", overflow: 'hidden' }}>
      <AppNav displayName={displayName} context={navContext} actions={navActions} />

      {/* Tab bar */}
      <div style={{ height: '52px', marginTop: '64px', background: 'var(--bg2)', borderBottom: '1px solid rgba(232,184,75,0.10)', display: 'flex', alignItems: 'center', padding: '0 40px', gap: '4px', flexShrink: 0, zIndex: 10 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px',
            padding: '6px 18px', borderRadius: '8px', cursor: 'pointer', transition: 'all .15s', border: 'none',
            background: tab === t ? 'var(--surface)' : 'none',
            color: tab === t ? '#e8b84b' : '#9a8f7a',
            boxShadow: tab === t ? '0 0 0 1px rgba(232,184,75,0.15)' : 'none',
          }}>
            {t}
            {t === 'Teams' && teams.length > 0 && <span style={{ marginLeft: '6px', fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#4a4438' }}>{teams.length}</span>}
            {t === 'Members' && members.length > 0 && <span style={{ marginLeft: '6px', fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#4a4438' }}>{members.length}</span>}
            {t === 'Board' && <span style={{ marginLeft: '6px', fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#4a4438' }}>{tiles.length}/25</span>}
          </button>
        ))}
      </div>

      {/* Tab content — fills remaining height */}
      <div style={{ height: 'calc(100vh - 64px - 52px)', overflow: 'hidden' }}>
        {tab === 'Board'    && <BoardTab   tiles={tiles}   eventId={event.id} isOwner={isOwner} />}
        {tab === 'Teams'    && <TeamsTab   teams={teams}   members={members} eventId={event.id} isOwner={isOwner} />}
        {tab === 'Members'  && <MembersTab members={members} teams={teams} eventId={event.id} isOwner={isOwner} currentUserId={currentUserId} />}
        {tab === 'Settings' && <SettingsTab event={event} eventId={event.id} isOwner={isOwner} />}
      </div>
    </div>
  )
}
