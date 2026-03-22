'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppNav } from '@/components/ui/AppNav'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { Avatar } from '@/components/ui/Avatar'
import {
  loadTemplate, removeTile, addTileAction,
  addTeamAction, removeTeam, assignTeam, toggleMod, saveWebhook, savePrizePool, saveRequireProof,
  goLive, endEvent,
} from '@/app/actions/forms'
import { updateTile } from '@/app/actions/tiles'
import { deleteEventVoid } from '@/app/actions/deleteEvent'

// ── OSRS catalogue ────────────────────────────────────────────────────────────
const WIKI = 'https://oldschool.runescape.wiki/images/'
// Use the wiki API to get image URLs - FilePath redirect works fine in img tags
const W = (n: string) => `https://oldschool.runescape.wiki/w/Special:FilePath/${encodeURIComponent(n.replace(/ /g, '_'))}.png?action=raw`

const OSRS_ITEMS = [
  { name: 'Twisted bow',  sprite: W('Twisted bow') },
  { name: 'Scythe of vitur',  sprite: W('Scythe of vitur') },
  { name: "Tumeken's shadow",  sprite: W("Tumeken's shadow") },
  { name: 'Ghrazi rapier',  sprite: W('Ghrazi rapier') },
  { name: "Osmumten's fang",  sprite: W("Osmumten's fang") },
  { name: 'Kodai wand', sprite: W('Kodai wand') },
  { name: 'Elder maul', sprite: W('Elder maul') },
  { name: 'Avernic hilt', sprite: W('Avernic defender hilt') },
  { name: 'Zaryte crossbow', sprite: W('Zaryte crossbow') },
  { name: 'Sanguinesti staff', sprite: W('Sanguinesti staff') },
  { name: 'Dragon hunter crossbow', sprite: W('Dragon hunter crossbow') },
  { name: 'Justiciar faceguard', sprite: W('Justiciar faceguard') },
  { name: "Elidinis' ward", sprite: W("Elidinis' ward (f)") },
  { name: 'Lightbearer', sprite: W('Lightbearer') },
  { name: 'Olmlet',  sprite: W('Olmlet') },
  { name: 'Magus ring',  sprite: W('Magus ring') },
  { name: "Inquisitor's mace", sprite: W("Inquisitor's mace") },
  { name: 'Dragon warhammer', sprite: W('Dragon warhammer') },
  { name: 'Infernal cape',  sprite: W('Infernal cape') },
  { name: "Lil' Zik",  sprite: W("Lil' zik") },
  { name: 'Jal-nib-rek',  sprite: W('Jal-nib-rek') },
  { name: 'Nightmare staff',  sprite: W('Nightmare staff') },
  { name: 'Ancestral robe top', sprite: W('Ancestral robe top') },
  { name: 'Blood torva',  sprite: W('Ancient blood ornament kit') },
  { name: 'Ancestral robe bottom', sprite: W('Ancestral robe bottom') },
  { name: 'Ancestral hat', sprite: W('Ancestral hat') },
  { name: 'Dexterous prayer scroll', sprite: W('Dexterous prayer scroll') },
  { name: 'Arcane prayer scroll', sprite: W('Arcane prayer scroll') },
  { name: "Dinh's bulwark", sprite: W("Dinh's bulwark") },
  { name: 'Dragon hunter lance', sprite: W('Dragon hunter lance') },
  { name: 'Dragon claws', sprite: W('Dragon claws') },
  { name: 'Justiciar legguards', sprite: W('Justiciar legguards') },
  { name: 'Justiciar chestguard', sprite: W('Justiciar chestguard') },
  { name: 'Avernic defender', sprite: W('Avernic defender') },
  { name: 'Torva full helm', sprite: W('Torva full helm') },
  { name: 'Torva platebody', sprite: W('Torva platebody') },
  { name: 'Torva platelegs', sprite: W('Torva platelegs') },
  { name: 'Bellator ring',  sprite: W('Bellator ring') },
  { name: 'Venator ring',  sprite: W('Venator ring') },
  { name: 'Ultor ring',  sprite: W('Ultor ring') },
  { name: "Inquisitor's great helm", sprite: W("Inquisitor's great helm") },
  { name: "Inquisitor's hauberk", sprite: W("Inquisitor's hauberk") },
  { name: "Inquisitor's plateskirt", sprite: W("Inquisitor's plateskirt") },
  { name: 'Volatile orb',  sprite: W('Volatile orb') },
  { name: 'Harmonised orb',  sprite: W('Harmonised orb') },
  { name: 'Eldritch orb',  sprite: W('Eldritch orb') },
  { name: 'Masori mask', sprite: W('Masori mask') },
  { name: 'Masori body', sprite: W('Masori body (f)') },
  { name: 'Masori chaps', sprite: W('Masori chaps (f)') },
  { name: 'Bandos chestplate', sprite: W('Bandos chestplate') },
  { name: 'Bandos tassets', sprite: W('Bandos tassets') },
  { name: 'Armadyl helmet', sprite: W('Armadyl helmet') },
  { name: 'Armadyl chestplate', sprite: W('Armadyl chestplate') },
  { name: 'Armadyl chainskirt', sprite: W('Armadyl chainskirt') },
  { name: 'Pet general graardor',  sprite: W('Pet general graardor') },
  { name: "Pet kree'arra",  sprite: W("Pet kree'arra") },
  { name: 'Abyssal whip', sprite: W('Abyssal whip') },
  { name: 'Abyssal dagger', sprite: W('Abyssal dagger') },
  { name: 'Trident of the seas', sprite: W('Trident of the seas') },
  { name: 'Occult necklace', sprite: W('Occult necklace') },
  { name: 'Tanzanite fang', sprite: W('Tanzanite fang') },
]

const TEAM_COLORS = ['#e8824b','#4b9ef0','#3ecf74','#a875f0','#e8b84b','#e85555','#4bd4e8','#f0c85a']
// ── Shared style helpers ──────────────────────────────────────────────────────
const input: React.CSSProperties = {
  width: '100%', height: '44px', padding: '0 14px',
  background: 'var(--bg3)', border: '1px solid rgba(232,184,75,0.2)',
  borderRadius: '8px', color: 'var(--text)', fontSize: '14px',
  outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border .15s',
}
const label: React.CSSProperties = {
  display: 'block', fontFamily: "'Press Start 2P',monospace",
  fontSize: '9px', color: '#6a5c3e', letterSpacing: '1px', marginBottom: '10px',
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

// ── Live OSRS item search using wiki API ───────────────────────────────────────
type OsrsItem = { name: string; sprite: string; id?: number }

// Curated bingo-relevant items with source metadata
const CURATED: OsrsItem[] = [
  { name: 'Twisted bow',  sprite: W('Twisted bow') },
  { name: 'Scythe of vitur',  sprite: W('Scythe of vitur') },
  { name: "Tumeken's shadow",  sprite: W("Tumeken's shadow") },
  { name: 'Ghrazi rapier',  sprite: W('Ghrazi rapier') },
  { name: "Osmumten's fang",  sprite: W("Osmumten's fang") },
  { name: 'Kodai wand', sprite: W('Kodai wand') },
  { name: 'Elder maul', sprite: W('Elder maul') },
  { name: 'Avernic defender hilt', sprite: W('Avernic defender hilt') },
  { name: 'Zaryte crossbow', sprite: W('Zaryte crossbow') },
  { name: 'Sanguinesti staff', sprite: W('Sanguinesti staff') },
  { name: 'Dragon hunter crossbow', sprite: W('Dragon hunter crossbow') },
  { name: 'Justiciar faceguard', sprite: W('Justiciar faceguard') },
  { name: "Elidinis' ward (f)", sprite: W("Elidinis' ward (f)") },
  { name: 'Lightbearer', sprite: W('Lightbearer') },
  { name: 'Olmlet',  sprite: W('Olmlet') },
  { name: 'Magus ring',  sprite: W('Magus ring') },
  { name: "Inquisitor's mace", sprite: W("Inquisitor's mace") },
  { name: 'Dragon warhammer', sprite: W('Dragon warhammer') },
  { name: 'Infernal cape',  sprite: W('Infernal cape') },
  { name: "Lil' zik",  sprite: W("Lil' zik") },
  { name: 'Jal-nib-rek',  sprite: W('Jal-nib-rek') },
  { name: 'Nightmare staff',  sprite: W('Nightmare staff') },
  { name: 'Ancestral robe top', sprite: W('Ancestral robe top') },
  { name: 'Ancient blood ornament kit',  sprite: W('Ancient blood ornament kit') },
  { name: 'Ancestral robe bottom', sprite: W('Ancestral robe bottom') },
  { name: 'Ancestral hat', sprite: W('Ancestral hat') },
  { name: 'Dexterous prayer scroll', sprite: W('Dexterous prayer scroll') },
  { name: 'Arcane prayer scroll', sprite: W('Arcane prayer scroll') },
  { name: "Dinh's bulwark", sprite: W("Dinh's bulwark") },
  { name: 'Dragon hunter lance', sprite: W('Dragon hunter lance') },
  { name: 'Dragon claws', sprite: W('Dragon claws') },
  { name: 'Justiciar legguards', sprite: W('Justiciar legguards') },
  { name: 'Justiciar chestguard', sprite: W('Justiciar chestguard') },
  { name: 'Avernic defender', sprite: W('Avernic defender') },
  { name: 'Torva full helm', sprite: W('Torva full helm') },
  { name: 'Torva platebody', sprite: W('Torva platebody') },
  { name: 'Torva platelegs', sprite: W('Torva platelegs') },
  { name: 'Nihil horn', sprite: W('Nihil horn') },
  { name: 'Bellator ring',  sprite: W('Bellator ring') },
  { name: 'Venator ring',  sprite: W('Venator ring') },
  { name: 'Ultor ring',  sprite: W('Ultor ring') },
  { name: "Inquisitor's great helm", sprite: W("Inquisitor's great helm") },
  { name: "Inquisitor's hauberk", sprite: W("Inquisitor's hauberk") },
  { name: "Inquisitor's plateskirt", sprite: W("Inquisitor's plateskirt") },
  { name: 'Volatile orb',  sprite: W('Volatile orb') },
  { name: 'Harmonised orb',  sprite: W('Harmonised orb') },
  { name: 'Eldritch orb',  sprite: W('Eldritch orb') },
  { name: 'Masori mask', sprite: W('Masori mask') },
  { name: 'Masori body (f)', sprite: W('Masori body (f)') },
  { name: 'Masori chaps (f)', sprite: W('Masori chaps (f)') },
  { name: 'Bandos chestplate', sprite: W('Bandos chestplate') },
  { name: 'Bandos tassets', sprite: W('Bandos tassets') },
  { name: 'Bandos boots', sprite: W('Bandos boots') },
  { name: 'Armadyl helmet', sprite: W('Armadyl helmet') },
  { name: 'Armadyl chestplate', sprite: W('Armadyl chestplate') },
  { name: 'Armadyl chainskirt', sprite: W('Armadyl chainskirt') },
  { name: 'Zamorakian spear', sprite: W('Zamorakian spear') },
  { name: 'Saradomin sword', sprite: W('Saradomin sword') },
  { name: 'Pet general graardor',  sprite: W('Pet general graardor') },
  { name: "Pet kree'arra",  sprite: W("Pet kree'arra") },
  { name: 'Pet zilyana',  sprite: W('Pet zilyana') },
  { name: 'Pet kril tsutsaroth',  sprite: W("Pet k'ril tsutsaroth") },
  { name: 'Abyssal whip', sprite: W('Abyssal whip') },
  { name: 'Abyssal dagger', sprite: W('Abyssal dagger') },
  { name: 'Trident of the seas', sprite: W('Trident of the seas') },
  { name: 'Occult necklace', sprite: W('Occult necklace') },
  { name: 'Tanzanite fang', sprite: W('Tanzanite fang') },
  { name: 'Magic fang', sprite: W('Magic fang') },
  { name: 'Jar of souls',  sprite: W('Jar of souls') },
  { name: 'Abyssal bludgeon', sprite: W('Abyssal bludgeon') },
  { name: 'Dragon pickaxe', sprite: W('Dragon pickaxe') },
  { name: 'Dragon 2h sword', sprite: W('Dragon 2h sword') },
  { name: "Voidwaker",  sprite: W('Voidwaker') },
  { name: 'Skull of vet\'ion',  sprite: W("Skull of vet'ion") },
  { name: 'Fangs of venenatis',  sprite: W('Fangs of venenatis') },
  { name: 'Claws of callisto',  sprite: W('Claws of callisto') },
  { name: 'Scorpia\'s offspring',  sprite: W("Scorpia's offspring") },
  { name: 'Amulet of torture', sprite: W('Amulet of torture') },
  { name: 'Necklace of anguish', sprite: W('Necklace of anguish') },
  { name: 'Tormented bracelet', sprite: W('Tormented bracelet') },
  { name: 'Tanzanite mutagen',  sprite: W('Tanzanite mutagen') },
  { name: 'Magma mutagen',  sprite: W('Magma mutagen') },
  { name: 'Pet snakeling',  sprite: W('Pet snakeling') },
  { name: 'Dragonfire ward', sprite: W('Dragonfire ward') },
  { name: 'Draconic visage', sprite: W('Draconic visage') },
  { name: 'Skeletal visage', sprite: W('Skeletal visage') },
  { name: 'Vorki',  sprite: W('Vorki') },
  { name: 'Zenyte shard',  sprite: W('Zenyte shard') },
  { name: 'Ballista spring', sprite: W('Ballista spring') },
  { name: 'Heavy frame', sprite: W('Heavy frame') },
  { name: 'Monkey tail', sprite: W('Monkey tail') },
  { name: 'Pegasian crystal',  sprite: W('Pegasian crystal') },
  { name: 'Eternal crystal',  sprite: W('Eternal crystal') },
  { name: 'Smouldering stone',  sprite: W('Smouldering stone') },
  { name: 'Hellpuppy',  sprite: W('Hellpuppy') },
  { name: 'Primordial crystal',  sprite: W('Primordial crystal') },
  { name: 'Blowpipe', sprite: W('Toxic blowpipe') },
  { name: 'Toxic staff of the dead', sprite: W('Toxic staff of the dead') },
  { name: 'Serpentine visage', sprite: W('Serpentine visage') },
  { name: 'Berserker ring (i)', sprite: W('Berserker ring (i)') },
  { name: 'Imbued heart', sprite: W('Imbued heart') },
  { name: 'Dust devil pet',  sprite: W('Noon') },
  { name: 'Crystal armour seed', sprite: W('Crystal armour seed') },
  { name: 'Crystal weapon seed', sprite: W('Crystal weapon seed') },
  { name: 'Youngllef',  sprite: W('Youngllef') },
  { name: 'Enhanced crystal weapon seed', sprite: W('Enhanced crystal weapon seed') },
  { name: 'Corrupted youngllef',  sprite: W('Corrupted youngllef') },
]

function useWikiSearch(query: string) {
  const [results, setResults] = useState<OsrsItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }

    // First check curated list
    const curatedMatches = CURATED.filter(i =>
      i.name.toLowerCase().includes(query.toLowerCase())
    )

    if (curatedMatches.length > 0) {
      setResults(curatedMatches.slice(0, 20))
      return
    }

    // Fall back to OSRS wiki search API for anything not in curated list
    setLoading(true)
    const controller = new AbortController()
    fetch(
      `https://oldschool.runescape.wiki/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=10&namespace=0&format=json&origin=*`,
      { signal: controller.signal }
    )
      .then(r => r.json())
      .then(([_, names]: [string, string[]]) => {
        const items: OsrsItem[] = names.map(n => ({
          name: n, sprite: W(n),
        }))
        setResults(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [query])

  return { results, loading }
}

function ItemSearchDropdown({ onSelect, takenPositions, boardTiles }: {
  onSelect: (item: OsrsItem) => void
  takenPositions: Set<number>
  boardTiles: any[]
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<OsrsItem | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { results: wikiResults, loading } = useWikiSearch(query)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const boardNames = new Set(boardTiles.filter(t => !t.free_space).map((t: any) => t.name.toLowerCase()))

  // Items to show: curated popular when no query, wiki results when searching
  const displayItems: OsrsItem[] = query.length < 2
    ? CURATED.slice(0, 16)
    : wikiResults.length > 0 ? wikiResults : CURATED.filter(i =>
        i.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)

  function pick(item: OsrsItem) {
    setSelected(item); setQuery(item.name); setOpen(false); onSelect(item)
  }

  function clear() {
    setSelected(null); setQuery(''); onSelect({ name: '', sprite: '' })
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => { setOpen(true) }} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        height: '48px', padding: '0 14px',
        background: 'var(--bg3)',
        border: `1px solid ${open ? 'rgba(232,184,75,0.5)' : 'rgba(232,184,75,0.2)'}`,
        borderRadius: '10px', cursor: 'text',
      }}>
        {selected?.sprite && (
          <img src={selected.sprite} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
        )}
        {!selected && <span style={{ fontSize: '16px', flexShrink: 0 }}>🔍</span>}
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) setSelected(null) }}
          onFocus={() => setOpen(true)}
          placeholder="Search any OSRS item — e.g. Dragon claws, Dharok, Bandos…"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '15px', fontFamily: "'DM Sans',sans-serif" }}
        />
        {loading && <span style={{ fontSize: '12px', color: '#4a4438' }}>…</span>}
        
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid rgba(232,184,75,0.18)', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.8)', zIndex: 300, maxHeight: '340px', overflowY: 'auto' }}>
          {!query && <div style={{ padding: '10px 14px 6px', fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#4a4438', letterSpacing: '1px' }}>POPULAR BINGO ITEMS · type to search all OSRS items</div>}
          {query.length >= 2 && wikiResults.length === 0 && !loading && <div style={{ padding: '10px 14px 6px', fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#4a4438' }}>SEARCHING CURATED LIST</div>}
          {displayItems.map((item, i) => {
            const onBoard = boardNames.has(item.name.toLowerCase())
            return (
              <div key={i} onClick={() => pick(item)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(232,184,75,0.04)', transition: 'background .1s', background: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
                <img src={item.sprite} alt={item.name} style={{ width: '32px', height: '32px', objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                  
                  
                </div>
              </div>
            )
          })}
          {/* Always allow custom */}
          {query && !CURATED.find(i => i.name.toLowerCase() === query.toLowerCase()) && (
            <div onClick={() => pick({ name: query, sprite: W(query) })}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', cursor: 'pointer', borderTop: '1px solid rgba(232,184,75,0.08)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(232,184,75,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>+</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: '#e8b84b' }}>Add "{query}" as custom tile</div>
                <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#4a4438', marginTop: '2px' }}>OSRS wiki sprite auto-loaded</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── TilePanel ────────────────────────────────────────────────────────────────
function TilePanel({ position, existingTile, eventId, boardTiles, onClose, onDone }: {
  position: number; existingTile: any | null; eventId: string
  boardTiles: any[]; onClose: () => void; onDone: () => void
}) {
  const isEdit = !!existingTile
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [selectedItem, setSelectedItem] = useState<OsrsItem | null>(
    isEdit && !existingTile.free_space
      ? { name: existingTile.name, sprite: existingTile.sprite_url ?? W(existingTile.name) }
      : null
  )
  const [customName, setCustomName] = useState<string>(
    isEdit && !existingTile.free_space ? existingTile.name : ''
  )

  function handleSelect(item: OsrsItem) {
    if (!item.name) { setSelectedItem(null); return }
    setSelectedItem(item)
    setCustomName(item.name)  // pre-populate name from dropdown
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedName = customName.trim()
    if (!trimmedName || !selectedItem?.sprite) return
    const fd = new FormData(e.currentTarget)
    fd.set('position', String(position))
    fd.set('name', trimmedName)
    fd.set('sprite_url', selectedItem.sprite)
    fd.set('is_purple', 'false')
    fd.set('source_raid', '')
    startTransition(async () => {
      if (isEdit) await updateTile(existingTile.id, eventId, fd)
      else await addTileAction(eventId, fd)
      onDone()
    })
  }

  function handleDelete() {
    if (!existingTile) return
    startDelete(async () => { await removeTile(existingTile.id, eventId); onDone() })
  }

  const canSubmit = !!customName.trim() && !!selectedItem?.sprite

  return (
    <div style={{ background: 'var(--bg2)', borderLeft: '1px solid rgba(232,184,75,0.12)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', width: '400px', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(232,184,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 10 }}>
        <div>
          <div style={label}>{isEdit ? 'EDIT TILE' : 'ADD TILE'} · POSITION {position + 1}</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '22px', color: 'var(--text)' }}>
            {isEdit ? existingTile.name : 'Choose an Item'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting}
              style={{ height: '38px', padding: '0 16px', background: 'rgba(232,85,85,0.08)', border: '1px solid rgba(232,85,85,0.25)', borderRadius: '8px', color: '#e85555', cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px' }}>
              {deleting ? '…' : 'Remove'}
            </button>
          )}
          <button onClick={onClose} style={{ width: '38px', height: '38px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.12)', borderRadius: '8px', color: '#9a8f7a', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input type="hidden" name="position" value={position} />

        {/* Sprite preview */}
        {selectedItem?.sprite && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '16px', border: '1px solid rgba(232,184,75,0.2)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={selectedItem.sprite} alt={customName} style={{ width: '72px', height: '72px', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' }}
                onError={e => (e.currentTarget.style.opacity = '0.2')} />
            </div>
          </div>
        )}

        {/* Item search */}
        <div>
          <div style={label}>SEARCH SPRITE</div>
          <ItemSearchDropdown onSelect={handleSelect} takenPositions={new Set()} boardTiles={boardTiles} />
          <div style={{ fontSize: '13px', color: '#6a5c3e', marginTop: '8px' }}>Search to pick a sprite — the name below will be pre-filled but you can edit it</div>
        </div>

        {/* Custom name */}
        <div>
          <div style={label}>TILE NAME</div>
          <input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="e.g. Twisted Bow, ToA Purple…"
            maxLength={40}
            style={{ ...input, fontSize: '16px', height: '50px' }}
          />
        </div>

        <button type="submit" disabled={pending || !canSubmit}
          style={{ ...btn('gold'), width: '100%', padding: '16px', fontSize: '15px', opacity: !canSubmit ? 0.4 : 1, cursor: !canSubmit ? 'not-allowed' : 'pointer' }}>
          {pending ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save Changes' : `Add to Position ${position + 1}`}
        </button>
      </form>
    </div>
  )
}


// ── BoardTab ──────────────────────────────────────────────────────────────────
function BoardTab({ tiles, eventId, isOwner }: { tiles: any[]; eventId: string; isOwner: boolean }) {
  const [selectedPos, setSelectedPos] = useState<number | null>(null)
  const [loadingTpl, startLoadTpl] = useTransition()
  const router = useRouter()

  const tileMap = new Map(tiles.map(t => [t.position, t]))
  const existingNames = tiles.filter(t => !t.free_space).map(t => t.name)
  const selectedTile = selectedPos !== null ? (tileMap.get(selectedPos) ?? null) : null

  function handleCellClick(pos: number) {
    if (!isOwner) return
    setSelectedPos(pos === selectedPos ? null : pos)
  }

  function handleDone() { setSelectedPos(null); router.refresh() }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Board area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(232,184,75,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '18px', color: 'var(--text)' }}>Bingo Board</div>
            <div style={{ fontSize: '13px', color: '#9a8f7a' }}>
              {tiles.length}/25 tiles
              {selectedPos !== null ? <span style={{ color: '#e8b84b', marginLeft: '8px' }}>· editing position {selectedPos}</span> : <span style={{ marginLeft: '8px' }}>· click empty cell to add</span>}
            </div>
            {tiles.length > 0 && tiles.length < 25 && (
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '6.5px', color: '#4a4438', padding: '5px 10px', border: '1px solid rgba(232,184,75,0.1)', borderRadius: '6px' }}>{25 - tiles.length} EMPTY</div>
            )}
          </div>
          {isOwner && tiles.length === 0 && (
            <button onClick={() => startLoadTpl(async () => { await loadTemplate(eventId); router.refresh() })} disabled={loadingTpl}
              style={{ ...btn('gold'), padding: '10px 20px', fontSize: '13px' }}>
              {loadingTpl ? 'Loading…' : '⚡ Load OSRS Template'}
            </button>
          )}
        </div>

        {/* Centered grid */}
        <div style={{ flex: 1, display: 'flex', alignItems: tiles.length === 0 ? 'center' : 'flex-start', justifyContent: 'center', padding: '32px', paddingTop: tiles.length > 0 ? '28px' : '32px' }}>
          {tiles.length === 0 ? (
            <div style={{ textAlign: 'center', maxWidth: '380px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '24px', color: 'var(--text)', marginBottom: '10px' }}>Board is empty</div>
              <p style={{ color: '#9a8f7a', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>Load the full OSRS bingo template instantly, or click any cell in the grid below to build your own board from scratch.</p>
              {isOwner && (
                <button onClick={() => startLoadTpl(async () => { await loadTemplate(eventId); router.refresh() })} disabled={loadingTpl}
                  style={{ ...btn('gold'), padding: '14px 32px', fontSize: '15px' }}>
                  {loadingTpl ? 'Loading…' : '⚡ Load OSRS Template'}
                </button>
              )}
              {/* Show grid even when empty so cells are clickable */}
              <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px', maxWidth: '380px' }}>
                {Array.from({ length: 25 }, (_, pos) => {
                  const isSelected = selectedPos === pos
                  return (
                    <div key={pos}
                      onClick={() => isOwner && setSelectedPos(pos === selectedPos ? null : pos)}
                      style={{ aspectRatio: '1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isOwner ? 'pointer' : 'default', transition: 'all .15s', background: isSelected ? 'rgba(232,184,75,0.08)' : 'var(--bg3)', border: isSelected ? '2px dashed rgba(232,184,75,0.5)' : '1px dashed rgba(255,255,255,0.05)', boxShadow: isSelected ? '0 0 0 2px rgba(232,184,75,0.12)' : 'none' }}>
                      <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: isSelected ? '8px' : '6px', color: isSelected ? '#e8b84b' : '#2a2520' }}>{isSelected ? '+ ADD' : pos}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', width: '100%', maxWidth: '680px' }}>
              {Array.from({ length: 25 }, (_, pos) => {
                const tile = tileMap.get(pos)
                const isSelected = selectedPos === pos
                return (
                  <div key={pos}
                    onClick={() => isOwner && handleCellClick(pos)}
                    style={{ aspectRatio: '1', borderRadius: '12px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '10px 6px 8px', overflow: 'hidden',
                      cursor: isOwner ? 'pointer' : 'default', transition: 'all .15s',
                      background: isSelected ? 'rgba(232,184,75,0.1)' : tile ? 'var(--surface)' : 'var(--bg3)',
                      border: isSelected ? '2px solid rgba(232,184,75,0.6)' : tile ? '1px solid rgba(255,255,255,0.07)' : '1px dashed rgba(255,255,255,0.05)',
                      boxShadow: isSelected ? '0 0 0 3px rgba(232,184,75,0.15)' : 'none',
                    }}>
                    {tile ? (
                      <>
                        
                        {/* Edit indicator */}
                        {isOwner && isSelected && (
                          <div style={{ position: 'absolute', top: '5px', right: '5px', fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#e8b84b', background: 'rgba(232,184,75,0.15)', border: '1px solid rgba(232,184,75,0.3)', borderRadius: '4px', padding: '2px 4px' }}>EDIT</div>
                        )}
                        {tile.sprite_url ? (
                          <img src={tile.sprite_url} alt={tile.name} style={{ width: '52%', height: '52%', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))' }} onError={e => (e.currentTarget.style.display = 'none')} />
                        ) : null}
                        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#c8b882', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>
                          {tile.name.split(' ').slice(0, 2).join(' ')}
                        </div>
                        
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: isSelected ? '9px' : '7px', color: isSelected ? '#e8b84b' : '#2a2520', transition: 'all .15s' }}>{isSelected ? '+ ADD' : pos}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selectedPos !== null && isOwner && (
        <TilePanel position={selectedPos} existingTile={selectedTile} eventId={eventId} boardTiles={tiles} onClose={() => setSelectedPos(null)} onDone={handleDone} />
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
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px 40px' }}>
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
                  <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#4a4438' }}>{teamMembers.length} MEMBERS</span>
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
                      <Avatar src={m.users?.avatar_url} name={m.users?.display_name ?? '?'} color={team.color} size={26} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', flex: 1 }}>{m.users?.display_name}</span>
                      {m.role === 'owner' && <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#7a5c1e' }}>OWNER</span>}
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
                    <Avatar src={m.users?.avatar_url} name={m.users?.display_name ?? '?'} size={26} />
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
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px 40px' }}>
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
              <Avatar src={usr?.avatar_url} name={usr?.display_name ?? '?'} color={team?.color ?? '#e8b84b'} size={42} />
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
                      style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', height: '40px', padding: '0 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all .15s', border: '1px solid', background: m.role === 'moderator' ? 'rgba(75,158,240,0.1)' : 'var(--surface)', borderColor: m.role === 'moderator' ? 'rgba(75,158,240,0.3)' : 'rgba(255,255,255,0.08)', color: m.role === 'moderator' ? '#4b9ef0' : '#4a4438' }}>
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
  const [prizePool, setPrizePool] = useState(event.prize_pool ? String(event.prize_pool) : '')
  const [requireProof, setRequireProof] = useState<boolean>(event.require_proof ?? false)
  const [saved, setSaved] = useState(false)
  const [prizeSaved, setPrizeSaved] = useState(false)
  const router = useRouter()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(); fd.set('webhook_url', webhook)
    startTransition(async () => { await saveWebhook(eventId, fd); setSaved(true); setTimeout(() => setSaved(false), 2500) })
  }

  function handleSavePrize(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(); fd.set('prize_pool', prizePool)
    startTransition(async () => { await savePrizePool(eventId, fd); setPrizeSaved(true); setTimeout(() => setPrizeSaved(false), 2500); router.refresh() })
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
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px 40px' }}>
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

        {/* Proof Required */}
        {isOwner && (
          <div style={{ ...card }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(232,184,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: 'var(--text)', marginBottom: '3px' }}>Require Proof</div>
                <div style={{ fontSize: '13px', color: '#9a8f7a' }}>Players must submit a screenshot URL to complete a tile</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0, marginLeft: '20px' }}>
                <div
                  onClick={() => { const next = !requireProof; setRequireProof(next); startTransition(async () => { await saveRequireProof(eventId, next) }) }}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', background: requireProof ? '#e8b84b' : 'var(--bg3)', border: `1px solid ${requireProof ? '#e8b84b' : 'rgba(255,255,255,0.1)'}`, position: 'relative', cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: requireProof ? '23px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: requireProof ? '#0c0a08' : '#4a4438', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                </div>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: requireProof ? '#e8b84b' : '#4a4438' }}>
                  {requireProof ? 'ON' : 'OFF'}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Prize Pool */}
        {isOwner && (
          <div style={{ ...card }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(232,184,75,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="22" cy="34" rx="14" ry="5" fill="#7a5c1e"/>
              <rect x="8" y="20" width="28" height="14" fill="#c8861a"/>
              <ellipse cx="22" cy="20" rx="14" ry="5" fill="#e8b84b"/>
              <ellipse cx="22" cy="28" rx="14" ry="5" fill="#7a5c1e"/>
              <rect x="8" y="14" width="28" height="14" fill="#c8861a"/>
              <ellipse cx="22" cy="14" rx="14" ry="5" fill="#e8b84b"/>
              <ellipse cx="22" cy="8" rx="14" ry="5" fill="#e8b84b"/>
              <ellipse cx="22" cy="8" rx="10" ry="3.5" fill="#f5d060"/>
            </svg>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: 'var(--text)' }}>Prize Pool</div>
            </div>
            <form onSubmit={handleSavePrize} style={{ padding: '20px 24px' }}>
              <div style={label}>AMOUNT (GP)</div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={prizePool}
                  onChange={e => setPrizePool(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 10000000"
                  style={{ ...input, flex: 1 }}
                />
                <button type="submit" disabled={pending} style={{ ...btn(prizeSaved ? 'ghost' : 'gold'), whiteSpace: 'nowrap' }}>
                  {pending ? 'Saving…' : prizeSaved ? '✓ Saved!' : 'Save'}
                </button>
              </div>
              {prizePool && (
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#e8b84b', fontWeight: 600 }}>
                  = {formatGP(parseInt(prizePool))} GP
                </div>
              )}
              <p style={{ fontSize: '13px', color: '#9a8f7a', marginTop: '10px' }}>Shown on the dashboard and board view to motivate your clan.</p>
            </form>
          </div>
        )}

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

function formatGP(gp: number): string {
  if (gp >= 1_000_000_000) return `${(gp / 1_000_000_000).toFixed(1)}B`
  if (gp >= 1_000_000) return `${(gp / 1_000_000).toFixed(1)}M`
  if (gp >= 1_000) return `${(gp / 1_000).toFixed(0)}K`
  return gp.toLocaleString()
}

// ── Tag helper ────────────────────────────────────────────────────────────────
function Tag({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color, padding: '3px 8px', borderRadius: '4px', background: bg, border: `1px solid ${border}` }}>{label}</span>
  )
}

// ── Main ManageClient ─────────────────────────────────────────────────────────
const TABS = ['Board', 'Teams', 'Members', 'Settings'] as const
type Tab = typeof TABS[number]

interface Props {
  event: any; tiles: any[]; teams: any[]; members: any[]
  isOwner: boolean; currentUserId: string; avatarUrl?: string | null
}

export function ManageClient({ event, tiles, teams, members, isOwner, currentUserId, avatarUrl }: Props) {
  useLockBodyScroll()
  const [tab, setTab] = useState<Tab>('Board')
  const displayName = members.find(m => m.users?.id === currentUserId)?.users?.display_name ?? ''

  const navContext = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Link href={`/events/${event.id}`} style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none', transition: 'color .15s' }}>← Board</Link>
      <span style={{ color: '#4a4438' }}>/</span>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{event.name}</span>
      <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', padding: '3px 8px', borderRadius: '3px', background: event.status === 'live' ? 'rgba(62,207,116,0.1)' : 'rgba(154,143,122,0.08)', color: event.status === 'live' ? '#3ecf74' : '#9a8f7a', border: `1px solid ${event.status === 'live' ? 'rgba(62,207,116,0.25)' : 'rgba(154,143,122,0.15)'}` }}>
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
    <>
      <div className="app-page">
        <AppNav displayName={displayName} avatarUrl={avatarUrl} context={navContext} actions={navActions} />

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
              {t === 'Teams' && teams.length > 0 && <span style={{ marginLeft: '6px', fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#4a4438' }}>{teams.length}</span>}
              {t === 'Members' && members.length > 0 && <span style={{ marginLeft: '6px', fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#4a4438' }}>{members.length}</span>}
              {t === 'Board' && <span style={{ marginLeft: '6px', fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: '#4a4438' }}>{tiles.length}/25</span>}
            </button>
          ))}
        </div>

        {/* Tab content — fills everything below nav + tabbar */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {tab === 'Board'    && <BoardTab   tiles={tiles}   eventId={event.id} isOwner={isOwner} />}
          {tab === 'Teams'    && <TeamsTab   teams={teams}   members={members} eventId={event.id} isOwner={isOwner} />}
          {tab === 'Members'  && <MembersTab members={members} teams={teams} eventId={event.id} isOwner={isOwner} currentUserId={currentUserId} />}
          {tab === 'Settings' && <SettingsTab event={event} eventId={event.id} isOwner={isOwner} />}
        </div>
      </div>
    </>
  )
}
