import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RealtimeBoard } from '@/components/event/RealtimeBoard'
import { MemberList } from '@/components/event/MemberList'
import { SubmissionsPanel } from '@/components/event/SubmissionsPanel'
import { goLive, endEvent } from '@/app/actions/forms'

const DASHBOARD_CSS = `
:root{--t1:#e8824b;--t2:#4b9ef0;--t3:#3ecf74;}
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");}
.topbar{grid-area:top;background:var(--bg2);border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;padding:0 18px;gap:12px;z-index:50;}
.logo-mark{display:grid;grid-template-columns:repeat(3,6px);grid-template-rows:repeat(3,6px);gap:2px;}
.logo-mark span{display:block;background:var(--gold);border-radius:1px;}
.logo-mark span.off{background:transparent;}
.tb-wordmark{font-family:'Syne',sans-serif;font-weight:800;font-size:17px;color:var(--text);letter-spacing:-0.5px;}
.tb-wordmark em{color:var(--gold);font-style:normal;}
.tb-mid{flex:1;display:flex;align-items:center;gap:10px;padding:0 16px;}
.tb-event-name{font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--text);letter-spacing:-0.3px;}
.live-badge{font-family:'Press Start 2P',monospace;font-size:6px;padding:3px 8px;border-radius:3px;background:rgba(62,207,116,0.12);color:var(--green);border:1px solid rgba(62,207,116,0.2);display:flex;align-items:center;gap:5px;}
.live-dot{width:5px;height:5px;background:var(--green);border-radius:50%;animation:livepulse 1.5s infinite;}
@keyframes livepulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(62,207,116,0.5);}50%{opacity:.6;box-shadow:0 0 0 4px rgba(62,207,116,0);}}
.tb-countdown{font-family:'Press Start 2P',monospace;font-size:7px;color:var(--text3);letter-spacing:.5px;background:var(--surface2);border:1px solid var(--border);padding:4px 9px;border-radius:6px;}
.tb-right{display:flex;align-items:center;gap:8px;}
.tb-btn{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--text2);background:none;border:1px solid var(--border2);padding:5px 12px;border-radius:6px;cursor:pointer;text-decoration:none;transition:color .2s,border-color .2s;}
.tb-btn:hover{color:var(--text);border-color:var(--gold-dim);}
.tb-btn-gold{font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:var(--bg);background:var(--gold);border:none;padding:6px 14px;border-radius:6px;cursor:pointer;text-decoration:none;transition:background .2s;box-shadow:0 0 16px rgba(232,184,75,0.2);}
.tb-btn-gold:hover{background:#f0c85a;}
.sidebar{grid-area:side;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;}
.sidebar::-webkit-scrollbar{width:3px;}
.sidebar::-webkit-scrollbar-thumb{background:var(--gold-dim);}
.sb-section{padding:14px 12px 6px;}
.sb-label{font-family:'Press Start 2P',monospace;font-size:6px;color:var(--text3);letter-spacing:2px;padding:0 4px;margin-bottom:8px;display:block;}
.sb-divider{height:1px;background:var(--border);margin:6px 12px;}
.nav-item{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:6px;cursor:pointer;color:var(--text2);text-decoration:none;font-size:13px;transition:all .15s;border:1px solid transparent;}
.nav-item:hover{color:var(--text);background:var(--surface);}
.nav-item.active{color:var(--text);background:var(--surface);border-color:var(--border);}
.nav-item.nav-locked{opacity:0.45;cursor:default;}
.nav-item.nav-locked:hover{background:none;color:var(--text2);}
.nav-lock{margin-left:auto;font-size:9px;opacity:0.7;}
.nav-icon{width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;opacity:.7;}
.nav-item.active .nav-icon{opacity:1;}
.team-tabs{display:flex;flex-direction:column;gap:3px;}
.team-tab{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:6px;cursor:pointer;border:1px solid transparent;transition:all .15s;position:relative;background:none;width:100%;text-align:left;}
.team-tab:hover{background:var(--surface);border-color:var(--border);}
.team-tab.active{background:var(--surface2);border-color:var(--border2);}
.team-tab-bar{position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 2px 2px 0;opacity:0;transition:opacity .15s;}
.team-tab.active .team-tab-bar{opacity:1;}
.team-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0;}
.team-tab-info{flex:1;min-width:0;}
.team-tab-name{font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;}
.team-mini-bar{height:2px;background:var(--bg3);border-radius:1px;overflow:hidden;}
.team-mini-fill{height:100%;border-radius:1px;transition:width .5s;}
.team-tab-score{font-family:'Press Start 2P',monospace;font-size:8px;flex-shrink:0;}
.main{grid-area:main;overflow-y:auto;overflow-x:hidden;background:var(--bg);display:flex;flex-direction:column;}
.main::-webkit-scrollbar{width:4px;}
.main::-webkit-scrollbar-thumb{background:var(--gold-dim);}
.main-header{padding:18px 20px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-shrink:0;}
.main-title{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;letter-spacing:-0.8px;color:var(--text);margin-bottom:2px;}
.main-subtitle{font-size:12px;color:var(--text2);font-weight:300;}
.board-wrap{flex:1;padding:14px 20px 0;display:flex;flex-direction:column;align-items:center;gap:0;}
.bingo-board{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;width:100%;max-width:820px;}
.tile{aspect-ratio:1;background:var(--surface);border:1px solid rgba(255,255,255,0.06);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s,border-color .15s,background .15s;padding:8px 4px 6px;animation:tileIn .25s both;}
@keyframes tileIn{from{opacity:0;transform:scale(.85);}to{opacity:1;transform:scale(1);}}
.tile.undone{background:var(--bg3);border-color:rgba(255,255,255,0.04);}
.tile.undone .tile-img{filter:drop-shadow(0 1px 3px rgba(0,0,0,.9)) grayscale(0.5) brightness(0.75);}
.tile.undone .tile-name{color:var(--text3);}
.tile[class*="done-"] .tile-img{filter:drop-shadow(0 2px 8px rgba(0,0,0,.9)) brightness(1.05);}
.tile::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;opacity:0;transition:opacity .2s;}
.tile.done-t1::before{background:var(--t1);opacity:1;}
.tile.done-t2::before{background:var(--t2);opacity:1;}
.tile.done-t3::before{background:var(--t3);opacity:1;}
.tile.done-t1.done-t2::before{background:linear-gradient(90deg,var(--t1) 50%,var(--t2) 50%);opacity:1;}
.tile.done-t1.done-t3::before{background:linear-gradient(90deg,var(--t1) 50%,var(--t3) 50%);opacity:1;}
.tile.done-t2.done-t3::before{background:linear-gradient(90deg,var(--t2) 50%,var(--t3) 50%);opacity:1;}
.tile.done-t1.done-t2.done-t3::before{background:linear-gradient(90deg,var(--t1) 33%,var(--t2) 33% 66%,var(--t3) 66%);opacity:1;}
.tile.team-undone{background:#0e0c09!important;border-color:rgba(255,255,255,0.04)!important;}
.tile.team-undone::before{opacity:0!important;}
.tile.team-undone .tile-img{filter:grayscale(1) brightness(0.4)!important;}
.tile.team-undone .tile-name{color:var(--text3)!important;opacity:0.5;}
.tile.team-undone:hover{background:#141008!important;transform:none!important;box-shadow:none!important;}
.tile.team-done{background:rgba(62,207,116,0.12)!important;border-color:rgba(62,207,116,0.55)!important;box-shadow:0 0 16px rgba(62,207,116,0.08)!important;}
.tile.team-done::before{background:var(--green)!important;opacity:1!important;}
.tile.team-done .tile-img{filter:drop-shadow(0 0 8px rgba(62,207,116,0.35)) brightness(1.1)!important;}
.tile.team-done .tile-name{color:#88ffbb!important;}
.tile.team-done:hover{background:rgba(62,207,116,0.18)!important;box-shadow:0 8px 28px rgba(62,207,116,0.15)!important;border-color:rgba(62,207,116,0.75)!important;}
.tile.team-done .team-check{display:flex!important;}
.team-check{display:none;position:absolute;top:5px;right:5px;width:18px;height:18px;background:var(--green);border-radius:3px;align-items:center;justify-content:center;font-size:10px;color:#062012;font-weight:900;box-shadow:0 0 8px rgba(62,207,116,0.5);}
.tile.purple-drop{border-color:rgba(168,117,240,0.25);}
.tile.free{background:rgba(232,184,75,0.06)!important;border-color:rgba(232,184,75,0.2)!important;cursor:default;}
.tile.free:hover{transform:none!important;box-shadow:none!important;}
.tile.free::before{opacity:0!important;}
@keyframes bingo-pulse-team{0%,100%{box-shadow:0 0 0 0 rgba(62,207,116,0);}50%{box-shadow:0 0 0 4px rgba(62,207,116,0.2);}}
.tile.bingo-line.team-done{animation:bingo-pulse-team 1.8s infinite;}
.tile-img{width:64%;height:64%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 2px 8px rgba(0,0,0,.9));transition:transform .15s,filter .15s;flex-shrink:0;}
.tile:hover .tile-img{transform:scale(1.1) translateY(-3px);}
.tile-img-wrap{width:64%;height:64%;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;}
.tile-name{font-family:'Press Start 2P',monospace;font-size:5.5px;text-align:center;color:var(--text3);line-height:1.5;padding:0 2px;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tile-ticks{position:absolute;bottom:4px;right:4px;display:flex;gap:2px;}
.tick{width:12px;height:12px;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:7px;color:#fff;font-weight:900;line-height:1;}
.purple-pip{position:absolute;top:4px;left:4px;width:6px;height:6px;background:var(--purple);border-radius:1px;box-shadow:0 0 5px var(--purple);}
.tile-raid{position:absolute;top:4px;right:4px;font-family:'Press Start 2P',monospace;font-size:5px;padding:2px 4px;border-radius:2px;line-height:1;}
.tile-raid.raid-cox{background:rgba(232,184,75,0.12);color:#e8b84b;}
.tile-raid.raid-tob{background:rgba(232,85,85,0.12);color:#e85555;}
.tile-raid.raid-toa{background:rgba(168,117,240,0.12);color:#a875f0;}
.tile-raid.raid-nex{background:rgba(75,158,240,0.12);color:#4b9ef0;}
.tile-raid.raid-nm{background:rgba(62,207,116,0.12);color:#3ecf74;}
.tile-raid.raid-dt2{background:rgba(232,130,75,0.12);color:#e8824b;}
.tile-raid.raid-inf{background:rgba(232,85,55,0.15);color:#ff7755;}
.tile-raid.raid-liz{background:rgba(100,200,80,0.12);color:#88dd66;}
.free-star{font-size:26px;line-height:1;flex-shrink:0;}
@keyframes bingo-pulse{0%,100%{box-shadow:0 0 0 0 rgba(232,184,75,0);}50%{box-shadow:0 0 0 3px rgba(232,184,75,0.25);}}
.tile.bingo-line{animation:bingo-pulse 1.8s infinite;}
.right{grid-area:right;background:var(--bg2);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;}
.right::-webkit-scrollbar{width:3px;}
.right::-webkit-scrollbar-thumb{background:var(--gold-dim);}
.rp{padding:14px;border-bottom:1px solid var(--border);}
.rp-label{font-family:'Press Start 2P',monospace;font-size:6px;color:var(--text3);letter-spacing:1.5px;margin-bottom:11px;display:block;}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:10px;}
.stat-val{font-family:'Syne',sans-serif;font-weight:800;font-size:22px;letter-spacing:-1px;display:block;line-height:1;margin-bottom:3px;}
.stat-lbl{font-family:'Press Start 2P',monospace;font-size:5.5px;color:var(--text3);letter-spacing:.4px;}
.tp-row{margin-bottom:10px;}
.tp-row:last-child{margin-bottom:0;}
.tp-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;}
.tp-name{display:flex;align-items:center;gap:6px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:var(--text);}
.tp-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0;}
.tp-pct{font-family:'Press Start 2P',monospace;font-size:7px;}
.tp-track{height:7px;background:var(--bg3);border-radius:3px;overflow:hidden;margin-bottom:4px;}
.tp-fill{height:100%;border-radius:3px;transition:width .7s cubic-bezier(.4,0,.2,1);}
.tp-sub{font-size:11px;color:var(--text3);}
.member-row{display:flex;align-items:center;gap:8px;padding:6px;border-radius:6px;transition:background .15s;cursor:default;}
.member-row:hover{background:var(--surface);}
.member-avatar{width:32px;height:32px;border-radius:50%;border:2px solid transparent;display:block;object-fit:cover;}
.member-info{flex:1;min-width:0;}
.member-name{font-size:12px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px;}
.member-meta{font-family:'Press Start 2P',monospace;font-size:6px;color:var(--text3);}
.member-tiles-badge{font-family:'Press Start 2P',monospace;font-size:7px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:3px 6px;flex-shrink:0;}
.feed-wrap{display:flex;flex-direction:column;gap:0;overflow:hidden;}
.feed-item{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);opacity:0;transform:translateX(16px);transition:opacity .4s,transform .4s;}
.feed-item:last-child{border-bottom:none;}
.feed-item.visible{opacity:1;transform:translateX(0);}
.feed-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid var(--border2);display:block;}
.feed-body{flex:1;min-width:0;}
.feed-text{font-size:12px;color:var(--text);line-height:1.45;margin-bottom:4px;}
.feed-text strong{color:var(--gold);}
.feed-footer{display:flex;align-items:center;gap:6px;}
.feed-pill{font-family:'Press Start 2P',monospace;font-size:5.5px;padding:2px 7px;border-radius:3px;display:inline-block;}
.feed-pill.purple{background:rgba(168,117,240,0.12);color:var(--purple);border:1px solid rgba(168,117,240,0.2);}
.feed-pill.bingo{background:rgba(232,184,75,0.12);color:var(--gold);border:1px solid rgba(232,184,75,0.2);}
.feed-pill.complete{background:rgba(62,207,116,0.10);color:var(--green);border:1px solid rgba(62,207,116,0.2);}
.feed-time{font-family:'Press Start 2P',monospace;font-size:6px;color:var(--text3);}
#toast-area{position:fixed;top:60px;right:16px;z-index:9000;display:flex;flex-direction:column;gap:8px;pointer-events:none;}
#team-progress-bars{width:100%;max-width:820px;margin-top:14px;display:none;flex-direction:column;gap:0;}
#team-progress-bars.visible{display:flex;}
.tpb-header{display:flex;align-items:center;justify-content:space-between;padding:10px 18px 8px;border-bottom:1px solid var(--border);}
.tpb-header-title{font-family:'Press Start 2P',monospace;font-size:7px;color:var(--gold);letter-spacing:1.5px;}
.tpb-header-sub{font-family:'Press Start 2P',monospace;font-size:6px;color:var(--text3);letter-spacing:0.5px;}
.tpb-card{background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden;}
.tpb-row{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:0;padding:14px 18px;border-bottom:1px solid var(--border);position:relative;transition:background .2s;cursor:pointer;}
.tpb-row:last-child{border-bottom:none;}
.tpb-row:hover{background:var(--surface);}
.tpb-row::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .2s;pointer-events:none;}
.tpb-row.rank-1::before{background:linear-gradient(90deg,rgba(255,215,0,0.06) 0%,transparent 50%);}
.tpb-row.rank-2::before{background:linear-gradient(90deg,rgba(192,192,192,0.05) 0%,transparent 50%);}
.tpb-row.rank-3::before{background:linear-gradient(90deg,rgba(205,127,50,0.05) 0%,transparent 50%);}
.tpb-row:hover::before{opacity:1;}
.tpb-row::after{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;opacity:0;transition:opacity .2s;}
.tpb-row.rank-1::after{background:#ffd700;opacity:0.7;}
.tpb-row.rank-2::after{background:#c0c0c0;opacity:0.5;}
.tpb-row.rank-3::after{background:#cd7f32;opacity:0.5;}
.tpb-medal{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative;z-index:1;}
.tpb-medal.gold{background:rgba(255,215,0,0.12);box-shadow:0 0 14px rgba(255,215,0,0.2);border:1px solid rgba(255,215,0,0.3);animation:medal-pulse-gold 3s ease-in-out infinite;}
.tpb-medal.silver{background:rgba(192,192,192,0.08);border:1px solid rgba(192,192,192,0.2);}
.tpb-medal.bronze{background:rgba(205,127,50,0.08);border:1px solid rgba(205,127,50,0.2);}
@keyframes medal-pulse-gold{0%,100%{box-shadow:0 0 14px rgba(255,215,0,0.2);}50%{box-shadow:0 0 24px rgba(255,215,0,0.4),0 0 40px rgba(255,215,0,0.1);}}
.tpb-mid{flex:1;padding:0 16px;position:relative;z-index:1;}
.tpb-team-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.tpb-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0;}
.tpb-name{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--text);letter-spacing:-0.3px;}
.tpb-track{height:12px;background:var(--bg3);border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,0.04);}
.tpb-fill{height:100%;border-radius:5px;transition:width 1s cubic-bezier(.34,1.2,.64,1);position:relative;min-width:4px;}
.tpb-fill::after{content:'';position:absolute;top:1px;left:2px;right:2px;height:40%;background:rgba(255,255,255,0.2);border-radius:4px 4px 0 0;}
@keyframes shimmer{from{background-position:200% 0;}to{background-position:-200% 0;}}
.tpb-row.rank-1 .tpb-fill::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%);animation:shimmer 2s linear infinite;background-size:200% 100%;}
.tpb-stats{display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:80px;position:relative;z-index:1;}
.tpb-pct{font-family:'Syne',sans-serif;font-weight:800;font-size:22px;letter-spacing:-1px;line-height:1;}
.tpb-chips{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;}
.tpb-chip{font-family:'Press Start 2P',monospace;font-size:5.5px;padding:2px 6px;border-radius:3px;white-space:nowrap;}
.tpb-chip.tiles{background:var(--surface2);color:var(--text3);border:1px solid var(--border);}
.tpb-chip.bingo{background:rgba(232,184,75,0.1);color:var(--gold);border:1px solid rgba(232,184,75,0.2);}
.tpb-chip.purp{background:rgba(168,117,240,0.1);color:var(--purple);border:1px solid rgba(168,117,240,0.15);}
`

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await db.from('events').select('*').eq('id', params.id).single()
  if (!event) notFound()

  const { data: membership } = await db
    .from('event_members').select('id, role')
    .eq('event_id', params.id).eq('user_id', user.id).single()

  if (!membership) redirect(`/join?code=${event.invite_code}`)

  const isOwnerOrMod = ['owner', 'moderator'].includes(membership.role)

  const { data: tiles } = await db
    .from('tiles')
    .select('*, tile_completions(id, status, proof_url, submitted_at, team_id, users!submitted_by(display_name))')
    .eq('event_id', params.id).order('position')

  const { data: teams } = await db
    .from('teams')
    .select('*, team_members(id, event_members(id, role, users(id, display_name, avatar_url)))')
    .eq('event_id', params.id).order('created_at')

  const { data: members } = await db
    .from('event_members')
    .select('id, role, joined_at, users(id, display_name, avatar_url)')
    .eq('event_id', params.id).order('joined_at')

  let pendingSubmissions: any[] = []
  if (isOwnerOrMod) {
    const tileIds = (tiles ?? []).map((t: any) => t.id)
    if (tileIds.length > 0) {
      const { data } = await db
        .from('tile_completions')
        .select('id, proof_url, status, submitted_at, tiles(name, is_purple, source_raid), teams(name, color), users!submitted_by(display_name)')
        .eq('status', 'pending').in('tile_id', tileIds)
        .order('submitted_at', { ascending: false })
      pendingSubmissions = data ?? []
    }
  }

  const userMemberRecord = (members ?? []).find((m: any) => m.users?.id === user.id)
  const userTeam = (teams ?? []).find((t: any) =>
    t.team_members?.some((tm: any) => tm.event_members?.id === userMemberRecord?.id)
  )

  const nonFreeTiles = (tiles ?? []).filter((t: any) => !t.free_space)
  const approvedTiles = nonFreeTiles.filter((t: any) =>
    t.tile_completions?.some((c: any) => c.status === 'approved')
  )
  const eventId = params.id

  const statusColor = event.status === 'live' ? 'var(--green)' : 'var(--text3)'

  return (
    <>
      <style>{DASHBOARD_CSS}</style>

      {/* TOPBAR */}
      <div className="topbar">
        <Link href="/" className="flex items-center gap-2 no-underline" style={{flexShrink:0}}>
          <div className="logo-mark">
            <span/><span className="off"/><span/>
            <span/><span/><span className="off"/>
            <span className="off"/><span/><span/>
          </div>
          <span className="tb-wordmark">Tile<em>Scape</em></span>
        </Link>

        <div className="tb-mid">
          <span className="tb-event-name">{event.name}</span>
          {event.status === 'live' && (
            <div className="live-badge"><div className="live-dot"></div>LIVE</div>
          )}
          {event.end_date && <CountdownTimer endDate={event.end_date} />}
        </div>

        <div className="tb-right">
          <Link href="/dashboard" className="tb-btn">← Dashboard</Link>
          {isOwnerOrMod && (
            <Link href={`/events/${eventId}/manage`} className="tb-btn">Manage</Link>
          )}
          {isOwnerOrMod && event.status === 'draft' && (
            <form action={goLive.bind(null, eventId)} style={{display:'contents'}}>
              <button type="submit" className="tb-btn-gold">Go Live</button>
            </form>
          )}
          {isOwnerOrMod && event.status === 'live' && (
            <form action={endEvent.bind(null, eventId)} style={{display:'contents'}}>
              <button type="submit" className="tb-btn">End Event</button>
            </form>
          )}
          {pendingSubmissions.length > 0 && (
            <span className="tb-btn" style={{color:'var(--gold)',borderColor:'rgba(232,184,75,0.3)',background:'rgba(232,184,75,0.06)'}}>
              {pendingSubmissions.length} PENDING
            </span>
          )}
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sb-section">
          <span className="sb-label">Navigate</span>
          <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
            <a className="nav-item active" href="#"><div className="nav-icon">⊞</div>Board</a>
            <a className="nav-item nav-locked" href="#"><div className="nav-icon">⚔</div>Teams<span className="nav-lock">🔒</span></a>
            <a className="nav-item nav-locked" href="#"><div className="nav-icon">🏆</div>Leaderboard<span className="nav-lock">🔒</span></a>
            {isOwnerOrMod && (
              <Link href={`/events/${eventId}/manage`} className="nav-item"><div className="nav-icon">⚙</div>Manage</Link>
            )}
          </div>
        </div>
        <div className="sb-divider"></div>
        <div className="sb-section" style={{flex:1}}>
          <span className="sb-label">Teams</span>
          <div className="team-tabs">
            {(teams ?? []).map((team: any) => {
              const done = (tiles ?? []).filter((t: any) =>
                !t.free_space && t.tile_completions?.some((c: any) => c.team_id === team.id && c.status === 'approved')
              ).length
              const pct = Math.round(done / Math.max(nonFreeTiles.length, 1) * 100)
              return (
                <div key={team.id} className="team-tab" style={{position:'relative'}}>
                  <div className="team-tab-bar" style={{background:team.color}}></div>
                  <div className="team-dot" style={{background:team.color}}></div>
                  <div className="team-tab-info">
                    <div className="team-tab-name">{team.name}</div>
                    <div className="team-mini-bar">
                      <div className="team-mini-fill" style={{width:`${pct}%`,background:team.color}}></div>
                    </div>
                  </div>
                  <span className="team-tab-score" style={{color:team.color}}>{done}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="sb-section" style={{borderTop:'1px solid var(--border)',paddingBottom:'14px'}}>
          <span className="sb-label">Invite Code</span>
          <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:'11px',color:'var(--gold)',letterSpacing:'2px'}}>{event.invite_code}</span>
        </div>
      </aside>

      {/* MAIN BOARD */}
      <main className="main" style={{
        backgroundImage:'linear-gradient(rgba(232,184,75,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(232,184,75,0.015) 1px,transparent 1px)',
        backgroundSize:'48px 48px',
      }}>
        <div className="main-header">
          <div>
            <div className="main-title">All Teams</div>
            <div className="main-subtitle">
              {approvedTiles.length} of {nonFreeTiles.length} tiles completed
            </div>
          </div>
        </div>

        <RealtimeBoard
          initialTiles={tiles ?? []}
          teams={teams ?? []}
          userTeamId={userTeam?.id ?? null}
          eventId={eventId}
          canSubmit={event.status === 'live'}
        />
      </main>

      {/* RIGHT PANEL */}
      <aside className="right">
        {isOwnerOrMod && pendingSubmissions.length > 0 && (
          <SubmissionsPanel submissions={pendingSubmissions} />
        )}

        {/* Stats */}
        <div className="rp">
          <span className="rp-label">Event Stats</span>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-val" style={{color:'var(--gold)'}}>{approvedTiles.length}</span>
              <span className="stat-lbl">Tiles Done</span>
            </div>
            <div className="stat-card">
              <span className="stat-val" style={{color:'var(--green)'}}>
                {Math.round(approvedTiles.length / Math.max(nonFreeTiles.length, 1) * 100)}%
              </span>
              <span className="stat-lbl">Complete</span>
            </div>
            <div className="stat-card">
              <span className="stat-val" style={{color:'var(--purple)'}}>
                {approvedTiles.filter((t: any) => t.is_purple).length}
              </span>
              <span className="stat-lbl">Purples</span>
            </div>
            <div className="stat-card">
              <span className="stat-val" style={{color:'var(--gold)'}}>
                {(teams ?? []).length}
              </span>
              <span className="stat-lbl">Teams</span>
            </div>
          </div>
        </div>

        {/* Team Progress */}
        <div className="rp">
          <span className="rp-label">Team Progress</span>
          {(teams ?? []).map((team: any) => {
            const done = (tiles ?? []).filter((t: any) =>
              !t.free_space && t.tile_completions?.some((c: any) => c.team_id === team.id && c.status === 'approved')
            ).length
            const pct = Math.round(done / Math.max(nonFreeTiles.length, 1) * 100)
            return (
              <div key={team.id} className="tp-row">
                <div className="tp-head">
                  <div className="tp-name">
                    <div className="tp-dot" style={{background:team.color}}></div>
                    {team.name}
                  </div>
                  <span className="tp-pct" style={{color:team.color}}>{pct}%</span>
                </div>
                <div className="tp-track">
                  <div className="tp-fill" style={{width:`${pct}%`,background:team.color}}></div>
                </div>
                <div className="tp-sub">{done} / {nonFreeTiles.length} tiles</div>
              </div>
            )
          })}
        </div>

        {/* Members */}
        <MemberList
          members={members ?? []}
          teams={teams ?? []}
          currentUserId={user.id}
          isOwnerOrMod={isOwnerOrMod}
          eventId={eventId}
        />
      </aside>
    </>
  )
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return <span className="tb-countdown">ENDED</span>
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return <span className="tb-countdown">{d}D {String(h).padStart(2,'0')}H {String(m).padStart(2,'0')}M {String(s).padStart(2,'0')}S</span>
}
