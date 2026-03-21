'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export function LandingPage() {
  useEffect(() => {
    const WIKI = 'https://oldschool.runescape.wiki/w/Special:FilePath/'
    const W = (n: string) => WIKI + encodeURIComponent(n.replace(/ /g, '_')) + '.png'
    const WD = (n: string) => `https://oldschool.runescape.wiki/images/${encodeURIComponent(n.replace(/ /g, '_'))}.png`

    // ── Hero board ──
    const HERO_TILES = [
      { sprite: W('Twisted bow'),            label: 'Tbow',       purple: true  },
      { sprite: W('Scythe of vitur'),        label: 'Scythe',     purple: true  },
      { sprite: W("Tumeken's shadow"),       label: 'Shadow',     purple: true  },
      { sprite: W('Ghrazi rapier'),          label: 'Rapier',     purple: true  },
      { sprite: W('Olmlet'),                 label: 'Olmlet',     purple: true  },
      { sprite: W('Kodai wand'),             label: 'Kodai',      purple: false },
      { sprite: W('Elder maul'),             label: 'Maul',       purple: false },
      { sprite: W('Avernic defender hilt'),  label: 'Avernic',    purple: false },
      { sprite: W('Ancestral robe top'),     label: 'Ancestral',  purple: false },
      { sprite: W('Zaryte crossbow'),        label: 'ZCB',        purple: false },
      { sprite: W('Dragon hunter crossbow'), label: 'DHCbow',     purple: false },
      { sprite: W('Justiciar faceguard'),    label: 'Justiciar',  purple: false },
      { sprite: W('Sanguinesti staff'),      label: 'Sang',       purple: false },
      { sprite: W('Lightbearer'),            label: 'Lightbearer',purple: false },
      { sprite: W('Ancestral robe bottom'),  label: 'Anc Legs',   purple: false },
    ]
    const PRE_DONE = [5, 7, 9, 10, 13]
    const heroBoard = document.getElementById('hero-board')
    if (!heroBoard) return

    const cellEls: HTMLElement[] = []
    HERO_TILES.forEach((t) => {
      const cell = document.createElement('div')
      cell.className = 'mini-cell' + (t.purple ? ' purple' : '')
      if (t.purple) { const pip = document.createElement('div'); pip.className = 'purple-pip'; cell.appendChild(pip) }
      const img = document.createElement('img') as HTMLImageElement
      img.src = t.sprite; img.alt = t.label
      img.onerror = function(this: HTMLImageElement) { this.style.opacity = '0.15' }
      cell.appendChild(img)
      const lbl = document.createElement('div'); lbl.className = 'mini-cell-label'; lbl.textContent = t.label; cell.appendChild(lbl)
      const tick = document.createElement('div'); tick.className = 'tick-badge'; tick.textContent = '✓'; cell.appendChild(tick)
      heroBoard.appendChild(cell)
      cellEls.push(cell)
    })
    PRE_DONE.forEach(i => cellEls[i]?.classList.add('done'))

    const ROW0 = [0,1,2,3,4]
    function checkTile(idx: number) {
      const cell = cellEls[idx]; if (!cell) return
      cell.classList.add('checking')
      setTimeout(() => { cell.classList.remove('checking'); cell.classList.add('done') }, 450)
    }
    function flashBingoRow(cb: () => void) {
      ROW0.forEach(i => cellEls[i]?.classList.add('bingo-flash'))
      setTimeout(() => { ROW0.forEach(i => cellEls[i]?.classList.remove('bingo-flash')); cb() }, 500)
    }
    function spawnParticles() {
      const overlay = document.getElementById('bingo-overlay'); if (!overlay) return
      const colors = ['#3ecf74','#e8b84b','#a875f0','#4b9ef0','#ffffff']
      for (let i = 0; i < 24; i++) {
        const p = document.createElement('div'); p.className = 'bingo-particle'
        const angle = (i / 24) * 360 + Math.random() * 15
        const dist = 60 + Math.random() * 80
        const dx = Math.cos(angle * Math.PI / 180) * dist
        const dy = Math.sin(angle * Math.PI / 180) * dist
        p.style.cssText = `left:50%;top:50%;margin:-3px;background:${colors[i % colors.length]};--dx:${dx}px;--dy:${dy}px;animation-delay:${Math.random()*0.15}s;`
        overlay.appendChild(p); setTimeout(() => p.remove(), 1000)
      }
    }
    function showBingo(cb: () => void) {
      const overlay = document.getElementById('bingo-overlay'); if (!overlay) return
      spawnParticles(); overlay.classList.add('show')
      setTimeout(() => { overlay.classList.remove('show'); setTimeout(cb, 300) }, 2200)
    }
    function resetRow0() { ROW0.forEach(i => cellEls[i]?.classList.remove('done','checking','bingo-flash')) }
    function runSequence() {
      let delay = 0
      ROW0.forEach((tileIdx, step) => {
        delay += step === 0 ? 800 : 700
        setTimeout(() => checkTile(tileIdx), delay)
      })
      setTimeout(() => {
        flashBingoRow(() => {
          setTimeout(() => {
            showBingo(() => { setTimeout(() => { resetRow0(); setTimeout(runSequence, 1200) }, 400) })
          }, 100)
        })
      }, delay + 500)
    }

    // stagger reveal
    cellEls.forEach((cell, i) => {
      cell.style.opacity = '0'; cell.style.transform = 'scale(0.82)'
      cell.style.transition = `opacity 0.3s ${0.5 + i * 0.04}s, transform 0.3s ${0.5 + i * 0.04}s`
      setTimeout(() => { cell.style.opacity = '1'; cell.style.transform = 'scale(1)' }, 50)
    })
    const t = setTimeout(runSequence, 1800)

    // ── Scroll reveal ──
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } })
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    // ── Marquee ──
    const MARQUEE_TILES = [
      { name:'Twisted bow',            src:WD('Twisted bow'),                 source:'CoX',    purple:true,  done:true  },
      { name:'Scythe of vitur',        src:WD('Scythe of vitur'),             source:'ToB',    purple:true,  done:true  },
      { name:"Tumeken's shadow",       src:WD("Tumeken's_shadow"),            source:'ToA',    purple:true,  done:false },
      { name:'Ghrazi rapier',          src:WD('Ghrazi rapier'),               source:'ToB',    purple:true,  done:true  },
      { name:"Osmumten's fang",        src:WD("Osmumten's_fang"),            source:'ToA',    purple:true,  done:false },
      { name:'Kodai wand',             src:WD('Kodai wand'),                  source:'CoX',    purple:false, done:true  },
      { name:'Elder maul',             src:WD('Elder maul'),                  source:'CoX',    purple:false, done:true  },
      { name:'Avernic hilt',           src:WD('Avernic defender hilt'),       source:'ToB',    purple:false, done:true  },
      { name:'Olmlet',                 src:WD('Olmlet'),                      source:'CoX',    purple:true,  done:true  },
      { name:'Zaryte xbow',            src:WD('Zaryte crossbow'),             source:'Nex',    purple:false, done:false },
      { name:'Sanguinesti',            src:WD('Sanguinesti staff'),           source:'ToB',    purple:false, done:true  },
      { name:'Blood torva kit',        src:WD('Ancient blood ornament kit'),  source:'Nex',    purple:true,  done:false },
      { name:'Lightbearer',            src:WD('Lightbearer'),                 source:'ToA',    purple:false, done:true  },
      { name:'Dragon hunter xbow',     src:WD('Dragon hunter crossbow'),      source:'CoX',    purple:false, done:false },
      { name:'Magus ring',             src:WD('Magus ring'),                  source:'DT2',    purple:true,  done:false },
      { name:'Dragon warhammer',       src:WD('Dragon warhammer'),            source:'Lizard', purple:false, done:true  },
      { name:'Infernal cape',          src:WD('Infernal cape'),               source:'Inferno',purple:true,  done:true  },
      { name:'Jal-nib-rek',            src:WD('Jal-nib-rek'),                source:'Inferno',purple:true,  done:false },
      { name:"Lil' Zik",               src:WD("Lil'_zik"),                   source:'ToB',    purple:true,  done:true  },
      { name:'Nightmare staff',        src:WD('Nightmare staff'),             source:'NM',     purple:true,  done:false },
      { name:"Elidinis' ward",         src:WD("Elidinis'_ward_(f)"),         source:'ToA',    purple:false, done:true  },
      { name:'Ancestral robe top',     src:WD('Ancestral robe top'),          source:'CoX',    purple:false, done:false },
      { name:"Inquisitor's mace",      src:WD("Inquisitor's_mace"),          source:'NM',     purple:false, done:true  },
      { name:'Justiciar faceguard',    src:WD('Justiciar faceguard'),         source:'ToB',    purple:false, done:false },
    ]

    function buildMarqueeTile(tile: typeof MARQUEE_TILES[0]) {
      const el = document.createElement('div')
      el.className = 'marquee-tile' + (tile.purple ? ' is-purple' : '') + (tile.done ? ' is-done' : '')
      if (tile.purple) { const pip = document.createElement('div'); pip.className = 'marquee-pip'; el.appendChild(pip) }
      if (tile.done) { const chk = document.createElement('div'); chk.className = 'marquee-check'; chk.textContent = '✓'; el.appendChild(chk) }
      const img = document.createElement('img') as HTMLImageElement
      img.className = 'marquee-sprite'; img.alt = tile.name; img.src = tile.src
      img.onerror = function(this: HTMLImageElement) {
        if (!this.dataset.retried) { this.dataset.retried = '1'; this.src = W(tile.name) }
        else { this.style.opacity = '0.1' }
      }
      el.appendChild(img)
      const name = document.createElement('div'); name.className = 'marquee-name'; name.textContent = tile.name; el.appendChild(name)
      const src = document.createElement('div'); src.className = 'marquee-source'; src.textContent = tile.source; el.appendChild(src)
      return el
    }

    const track = document.getElementById('marquee-track')
    if (track) {
      ;[...MARQUEE_TILES, ...MARQUEE_TILES].forEach(tile => track.appendChild(buildMarqueeTile(tile)))
    }

    // ── Canvas avatars ──
    function drawTestiAvatar(canvasId: string, name: string, color: string) {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null; if (!canvas) return
      const size = 36; canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d'); if (!ctx) return
      const hash = Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)
      const r = Math.abs(hash)
      ctx.fillStyle = color + '33'; ctx.beginPath(); ctx.arc(size/2,size/2,size/2,0,Math.PI*2); ctx.fill()
      ctx.strokeStyle = color + '88'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(size/2,size/2,size/2-0.75,0,Math.PI*2); ctx.stroke()
      ctx.fillStyle = color; const eyeS = size*0.09
      ctx.fillRect(size*0.28,size*0.38,eyeS,eyeS); ctx.fillRect(size*0.62,size*0.38,eyeS,eyeS)
      ctx.fillStyle = color + 'cc'; const my = size*0.58
      if (r%2===0) { ctx.beginPath(); ctx.arc(size/2,my,size*0.11,0,Math.PI); ctx.fill() }
      else { ctx.fillRect(size*0.33,my,size*0.34,eyeS*0.8) }
      ctx.fillStyle = color; ctx.font = `bold ${size*0.25}px 'Press Start 2P',monospace`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(name.substring(0,2).toUpperCase(), size/2, size*0.74)
    }
    drawTestiAvatar('tav-1','Zekrom99','#e8824b')
    drawTestiAvatar('tav-2','ArmaRaider','#4b9ef0')
    drawTestiAvatar('tav-3','MossyMage','#3ecf74')

    return () => { clearTimeout(t); observer.disconnect() }
  }, [])

  return (
    <>
      <style>{LANDING_CSS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav>
        <a href="/" className="nav-logo">
          <div className="logo-pixel">
            <span/><span style={{opacity:0,background:'transparent'}}/><span/>
            <span/><span/><span style={{opacity:0,background:'transparent'}}/>
            <span style={{opacity:0,background:'transparent'}}/><span/><span/>
          </div>
          <span className="logo-text">Tile<em>Scape</em></span>
        </a>
        <ul>
          <li><a href="#tiles-marquee">How It Works</a></li>
          <li><a href="#testimonials">Reviews</a></li>
          <li><a href="/preview">Preview Dashboard</a></li>
        </ul>
        <div className="nav-actions">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/login" className="btn-gold">Register →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-eyebrow">
          <div className="eyebrow-dot"></div>
          <span className="eyebrow-text">Join the Early Access</span>
        </div>
        <h1 className="hero-title">Run Better<br/>Clan <span className="accent">Bingos</span></h1>
        <p className="hero-sub">The modern event platform built for OSRS clans. Track bingo boards, manage teams, and celebrate every purple drop — no spreadsheets required.</p>
        <div className="hero-ctas">
          <Link href="/login" className="btn-hero-primary">Create Your Clan Board</Link>
          <Link href="/preview" className="btn-hero-secondary">Preview Dashboard →</Link>
        </div>
        <div className="hero-board">
          <div className="board-chrome">
            <div className="board-chrome-bar">
              <div className="chrome-dots">
                <div className="chrome-dot"/><div className="chrome-dot"/><div className="chrome-dot"/>
              </div>
              <div className="chrome-title">Dragon Slayers CC — Bingo Week 3</div>
              <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:'6px',color:'var(--green)'}}>● LIVE</div>
            </div>
            <div className="board-inner" style={{position:'relative'}}>
              <div className="mini-grid" id="hero-board"></div>
              <div id="bingo-overlay"><div className="bingo-text">BINGO!</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <div className="proof-bar">
        {[
          {num:'2,400+',label:'Active Clans'},
          {num:'18k+',label:'Members Tracked'},
          {num:'94k+',label:'Tiles Completed'},
          {num:'6,500+',label:'Events Hosted'},
        ].map((s,i) => (
          <div key={i} style={{display:'contents'}}>
            {i > 0 && <div className="proof-divider"/>}
            <div className="proof-stat">
              <span className="proof-num">{s.num}</span>
              <span className="proof-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS + MARQUEE */}
      <section id="tiles-marquee" style={{padding:'100px 0 0'}}>
        <div style={{maxWidth:'680px',margin:'0 auto',padding:'0 48px',textAlign:'center'}} className="reveal">
          <span className="section-eyebrow" style={{display:'block',textAlign:'center'}}>How It Works</span>
          <h2 className="section-title" style={{textAlign:'center',marginBottom:'48px'}}>Up and running<br/>in minutes.</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'24px',textAlign:'left'}}>
            {[
              {num:'01',title:'Create your event',desc:'Register in seconds, create an event, share the invite code with your clan.'},
              {num:'02',title:'Build your board',desc:'Pick your tiles — bosses, skills, drops. Set your start and end date and go live.'},
              {num:'03',title:'Grind & celebrate',desc:'Members submit drops. Admins approve. Bingos get announced. Your clan does the rest.'},
            ].map((step) => (
              <div key={step.num} style={{padding:'20px',borderRadius:'var(--r2)',border:'1px solid var(--border)',background:'var(--surface)',display:'flex',flexDirection:'column',gap:'10px'}}>
                <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:'12px',color:'var(--gold-dim)'}}>{step.num}</div>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'17px',color:'var(--text)',marginBottom:'6px'}}>{step.title}</div>
                  <p style={{fontSize:'14px',color:'var(--text2)',lineHeight:1.6,fontWeight:300}}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:'56px'}}>
          <div className="marquee-track-wrap">
            <div className="marquee-track" id="marquee-track"></div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials">
        <div className="reveal" style={{textAlign:'center',marginBottom:0}}>
          <span className="section-eyebrow" style={{display:'block',textAlign:'center'}}>Reviews</span>
          <h2 className="section-title" style={{textAlign:'center'}}>Clan leaders love it.</h2>
        </div>
        <div className="testi-grid reveal">
          {[
            {id:'tav-1',quote:'We used to run bingos on a shared Google Sheet that nobody could figure out. TileScape fixed that overnight. The purple drop highlight alone gets the whole Discord going every time.',name:'Zekrom99',clan:'Leader — Bandos Boys CC',stars:5},
            {id:'tav-2',quote:'Brilliant for running events — the team progress bars and live leaderboard keep rivalry high all week. Would love a mobile app eventually, but the site works fine on phone for now.',name:'ArmaRaider',clan:'Organiser — Crystal Key Clan',stars:4},
            {id:'tav-3',quote:'52 members, three teams, a month-long bingo. TileScape handled everything without a hitch. I actually spent time playing the game instead of wrangling a spreadsheet.',name:'MossyMage',clan:'Leader — The Varrock Guards',stars:5},
          ].map((t) => (
            <div key={t.id} className="testi-card">
              <div className="testi-stars">
                {Array.from({length:5},(_,i) => (
                  <div key={i} className="testi-star" style={i >= t.stars ? {background:'var(--surface2)',clipPath:'none',width:'10px',height:'10px',borderRadius:'2px',border:'1px solid var(--border2)'} : {}}/>
                ))}
              </div>
              <p className="testi-quote">{t.quote}</p>
              <div className="testi-author">
                <canvas className="testi-avatar" id={t.id} width="36" height="36"/>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-clan">{t.clan}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="cta">
        <div className="cta-inner">
          <span className="cta-pixel-label">⚔ Join the Early Access</span>
          <h2 className="cta-title">Ready to run<br/>your best bingo?</h2>
          <p className="cta-sub">Join 2,400+ clans already tracking their events on TileScape.</p>
          <Link href="/login" className="btn-hero-primary" style={{fontSize:'16px',padding:'16px 40px',display:'inline-block'}}>Create Your Clan Board →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">Tile<em>Scape</em></div>
        <div className="footer-links">
          <a href="#tiles-marquee">How It Works</a>
          <a href="#testimonials">Reviews</a>
          <Link href="/preview">Dashboard</Link>
          <Link href="/login">Log in</Link>
          <Link href="/login">Register</Link>
        </div>
        <div className="footer-copy">© 2025 TileScape · Not affiliated with Jagex</div>
      </footer>
    </>
  )
}

const LANDING_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { background: #0c0a08; color: #f0e8d8; font-family: 'DM Sans', sans-serif; font-size: 16px; line-height: 1.6; overflow-x: hidden; }
body::before { content: ''; position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 9999; opacity: 0.55; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0c0a08; } ::-webkit-scrollbar-thumb { background: #7a5c1e; }
:root { --bg:#0c0a08;--bg2:#110e0a;--bg3:#181410;--surface:#1e1a14;--surface2:#252018;--gold:#e8b84b;--gold-dim:#7a5c1e;--gold-glow:rgba(232,184,75,0.18);--green:#3ecf74;--purple:#a875f0;--text:#f0e8d8;--text2:#9a8f7a;--text3:#4a4438;--border:rgba(232,184,75,0.12);--border2:rgba(232,184,75,0.22);--r:6px;--r2:12px; }
nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; height: 64px; background: rgba(12,10,8,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
.nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.logo-pixel { display: grid; grid-template-columns: repeat(3,8px); grid-template-rows: repeat(3,8px); gap: 2px; }
.logo-pixel span { background: var(--gold); display: block; opacity: 0; animation: pixelIn 0.4s forwards; }
.logo-pixel span:nth-child(1){animation-delay:0s} .logo-pixel span:nth-child(2){animation-delay:.05s;opacity:0;background:transparent} .logo-pixel span:nth-child(3){animation-delay:.1s} .logo-pixel span:nth-child(4){animation-delay:.15s} .logo-pixel span:nth-child(5){animation-delay:.2s} .logo-pixel span:nth-child(6){animation-delay:.25s;opacity:0;background:transparent} .logo-pixel span:nth-child(7){animation-delay:.3s;opacity:0;background:transparent} .logo-pixel span:nth-child(8){animation-delay:.35s} .logo-pixel span:nth-child(9){animation-delay:.4s}
@keyframes pixelIn { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
.logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: var(--text); letter-spacing: -0.5px; }
.logo-text em { color: var(--gold); font-style: normal; }
nav ul { list-style: none; display: flex; gap: 36px; align-items: center; }
nav ul a { font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text2); text-decoration: none; transition: color 0.2s; }
nav ul a:hover { color: var(--text); }
.nav-actions { display: flex; gap: 12px; align-items: center; }
.btn-ghost { font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text2); background: none; border: 1px solid var(--border2); padding: 8px 18px; border-radius: var(--r); cursor: pointer; text-decoration: none; transition: all 0.2s; }
.btn-ghost:hover { color: var(--text); border-color: var(--gold-dim); background: rgba(232,184,75,0.06); }
.btn-gold { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: var(--bg); background: var(--gold); border: none; padding: 9px 20px; border-radius: var(--r); cursor: pointer; text-decoration: none; letter-spacing: 0.3px; transition: all 0.2s; box-shadow: 0 0 20px rgba(232,184,75,0.2); }
.btn-gold:hover { background: #f0c85a; box-shadow: 0 0 32px rgba(232,184,75,0.35); transform: translateY(-1px); }
.hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 24px 80px; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: -10%; left: 50%; transform: translateX(-50%); width: 900px; height: 600px; background: radial-gradient(ellipse, rgba(232,184,75,0.10) 0%, transparent 65%); pointer-events: none; }
.hero::after { content: ''; position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 80%); pointer-events: none; }
.hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(232,184,75,0.08); border: 1px solid var(--border2); border-radius: 999px; padding: 6px 14px; margin-bottom: 32px; opacity: 0; animation: fadeUp 0.6s 0.1s forwards; }
.eyebrow-dot { width: 6px; height: 6px; background: var(--green); border-radius: 999px; box-shadow: 0 0 6px var(--green); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.eyebrow-text { font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--gold); letter-spacing: 1px; }
.hero-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(48px,8vw,96px); letter-spacing: -2px; line-height: 0.95; color: var(--text); margin-bottom: 24px; opacity: 0; animation: fadeUp 0.7s 0.25s forwards; }
.hero-title .accent { color: var(--gold); position: relative; display: inline-block; }
.hero-title .accent::after { content: ''; position: absolute; bottom: 4px; left: 0; right: 0; height: 4px; background: var(--gold); opacity: 0.3; }
.hero-sub { font-size: clamp(16px,2vw,20px); color: var(--text2); max-width: 540px; margin: 0 auto 40px; font-weight: 300; opacity: 0; animation: fadeUp 0.7s 0.4s forwards; }
.hero-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; opacity: 0; animation: fadeUp 0.7s 0.55s forwards; }
.btn-hero-primary { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: var(--bg); background: var(--gold); border: none; padding: 14px 32px; border-radius: var(--r); cursor: pointer; text-decoration: none; box-shadow: 0 0 40px rgba(232,184,75,0.25); transition: all 0.2s; }
.btn-hero-primary:hover { background: #f0c85a; box-shadow: 0 0 60px rgba(232,184,75,0.4); transform: translateY(-2px); }
.btn-hero-secondary { font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--text); background: var(--surface); border: 1px solid var(--border2); padding: 14px 32px; border-radius: var(--r); cursor: pointer; text-decoration: none; transition: all 0.2s; }
.btn-hero-secondary:hover { border-color: var(--gold-dim); background: var(--surface2); transform: translateY(-2px); }
.hero-board { margin-top: 72px; opacity: 0; animation: fadeUp 0.8s 0.7s forwards; position: relative; }
.hero-board::before { content: ''; position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%); width: 600px; height: 200px; background: radial-gradient(ellipse, rgba(232,184,75,0.12) 0%, transparent 70%); pointer-events: none; }
.board-chrome { background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r2); overflow: hidden; box-shadow: 0 0 0 1px rgba(0,0,0,0.5), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(232,184,75,0.06); }
.board-chrome-bar { background: var(--surface2); border-bottom: 1px solid var(--border); padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
.chrome-dots { display: flex; gap: 6px; } .chrome-dot { width: 10px; height: 10px; border-radius: 50%; }
.chrome-dot:nth-child(1){background:#ff5f57} .chrome-dot:nth-child(2){background:#febc2e} .chrome-dot:nth-child(3){background:#28c840}
.chrome-title { font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--text3); flex: 1; text-align: center; letter-spacing: 1px; }
.board-inner { padding: 20px; }
.mini-grid { display: grid; grid-template-columns: repeat(5,80px); grid-template-rows: repeat(3,80px); gap: 6px; }
.mini-cell { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--r); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; position: relative; overflow: hidden; transition: background 0.4s, border-color 0.4s, box-shadow 0.4s, transform 0.2s; }
.mini-cell img { width: 36px; height: 36px; object-fit: contain; image-rendering: pixelated; filter: grayscale(0.7) brightness(0.65) drop-shadow(0 1px 3px rgba(0,0,0,0.8)); transition: filter 0.4s, transform 0.3s; }
.mini-cell.done { background: rgba(62,207,116,0.13); border-color: rgba(62,207,116,0.55); box-shadow: 0 0 12px rgba(62,207,116,0.08); }
.mini-cell.done img { filter: brightness(1.1) drop-shadow(0 0 6px rgba(62,207,116,0.4)); }
.mini-cell.bingo-flash { background: rgba(62,207,116,0.22)!important; border-color: rgba(62,207,116,0.8)!important; box-shadow: 0 0 20px rgba(62,207,116,0.25)!important; transform: scale(1.06); }
@keyframes tile-check { 0%{transform:scale(1)} 40%{transform:scale(1.18)} 65%{transform:scale(0.94)} 100%{transform:scale(1)} }
.mini-cell.checking { animation: tile-check 0.45s ease forwards; }
.mini-cell.purple { border-color: rgba(168,117,240,0.25); } .mini-cell.purple.done { border-color: rgba(62,207,116,0.55); }
.mini-cell-label { font-family: 'Press Start 2P', monospace; font-size: 5px; color: var(--text3); text-align: center; line-height: 1.4; padding: 0 4px; transition: color 0.3s; }
.mini-cell.done .mini-cell-label { color: rgba(62,207,116,0.7); }
.tick-badge { position: absolute; top: 4px; right: 4px; width: 16px; height: 16px; background: var(--green); border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #041a0c; font-weight: 900; opacity: 0; transform: scale(0); transition: opacity 0.25s, transform 0.25s; box-shadow: 0 0 6px rgba(62,207,116,0.5); }
.mini-cell.done .tick-badge { opacity: 1; transform: scale(1); }
.purple-pip { position: absolute; top: 4px; left: 4px; width: 6px; height: 6px; background: var(--purple); border-radius: 1px; box-shadow: 0 0 6px var(--purple); }
#bingo-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 10; opacity: 0; transition: opacity 0.2s; }
#bingo-overlay.show { opacity: 1; }
.bingo-text { font-family: 'Press Start 2P', monospace; font-size: 28px; color: var(--green); text-shadow: 0 0 20px rgba(62,207,116,0.9), 0 0 40px rgba(62,207,116,0.5), 3px 3px 0 rgba(0,0,0,0.8); letter-spacing: 4px; transform: scale(0) rotate(-8deg); transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); white-space: nowrap; }
#bingo-overlay.show .bingo-text { transform: scale(1) rotate(0deg); }
.bingo-particle { position: absolute; width: 6px; height: 6px; border-radius: 50%; pointer-events: none; animation: particle-fly 0.8s ease-out forwards; }
@keyframes particle-fly { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0)} }
.proof-bar { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--bg2); padding: 20px 48px; display: flex; align-items: center; justify-content: center; gap: 56px; flex-wrap: wrap; }
.proof-stat { text-align: center; }
.proof-num { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 28px; color: var(--gold); display: block; letter-spacing: -1px; line-height: 1; margin-bottom: 4px; }
.proof-label { font-size: 12px; color: var(--text2); letter-spacing: 0.5px; }
.proof-divider { width: 1px; height: 40px; background: var(--border2); }
section { padding: 100px 48px; }
.section-eyebrow { font-family: 'Press Start 2P', monospace; font-size: 7px; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; display: block; opacity: 0.8; }
.section-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(30px,4vw,48px); letter-spacing: -1.5px; color: var(--text); line-height: 1.05; margin-bottom: 16px; }
#tiles-marquee { padding: 48px 0 72px; background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); overflow: hidden; }
.marquee-track-wrap { position: relative; overflow: hidden; }
.marquee-track-wrap::before, .marquee-track-wrap::after { content: ''; position: absolute; top: 0; bottom: 0; width: 120px; z-index: 2; pointer-events: none; }
.marquee-track-wrap::before { left: 0; background: linear-gradient(90deg, var(--bg2), transparent); }
.marquee-track-wrap::after { right: 0; background: linear-gradient(-90deg, var(--bg2), transparent); }
.marquee-track { display: flex; gap: 10px; width: max-content; animation: marquee-scroll 38s linear infinite; }
.marquee-track:hover { animation-play-state: paused; }
@keyframes marquee-scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.marquee-tile { display: flex; flex-direction: column; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r2); padding: 14px 12px 12px; width: 110px; flex-shrink: 0; position: relative; transition: border-color 0.2s, transform 0.2s; cursor: default; }
.marquee-tile:hover { border-color: var(--border2); transform: translateY(-3px); }
.marquee-tile.is-purple { border-color: rgba(168,117,240,0.22); }
.marquee-tile.is-purple::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--purple); border-radius: var(--r2) var(--r2) 0 0; opacity: 0.7; }
.marquee-tile.is-done { border-color: rgba(62,207,116,0.3); }
.marquee-tile.is-done::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--green); border-radius: var(--r2) var(--r2) 0 0; }
.marquee-sprite { width: 52px; height: 52px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.9)); transition: transform 0.2s; }
.marquee-tile:hover .marquee-sprite { transform: scale(1.1) translateY(-2px); }
.marquee-name { font-family: 'Press Start 2P', monospace; font-size: 5.5px; text-align: center; color: var(--text2); line-height: 1.5; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.marquee-source { font-family: 'Press Start 2P', monospace; font-size: 5px; color: var(--text3); letter-spacing: 0.3px; }
.marquee-pip { position: absolute; top: 5px; left: 5px; width: 5px; height: 5px; background: var(--purple); border-radius: 1px; box-shadow: 0 0 4px var(--purple); }
.marquee-check { position: absolute; top: 5px; right: 5px; width: 13px; height: 13px; background: var(--green); border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 7px; color: #041a0c; font-weight: 900; }
#testimonials { max-width: 1100px; margin: 0 auto; }
.testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 56px; }
.testi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r2); padding: 28px; display: flex; flex-direction: column; gap: 16px; transition: border-color 0.2s; }
.testi-card:hover { border-color: var(--border2); }
.testi-stars { display: flex; gap: 3px; }
.testi-star { width: 12px; height: 12px; background: var(--gold); clip-path: polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
.testi-quote { font-size: 15px; color: var(--text); line-height: 1.65; font-weight: 300; flex: 1; }
.testi-author { display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--border); padding-top: 16px; }
.testi-avatar { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border2); flex-shrink: 0; display: block; }
.testi-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: var(--text); margin-bottom: 2px; }
.testi-clan { font-size: 12px; color: var(--text2); }
.cta-section { padding: 120px 48px; text-align: center; position: relative; overflow: hidden; }
.cta-section::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 800px; height: 500px; background: radial-gradient(ellipse, rgba(232,184,75,0.08) 0%, transparent 65%); pointer-events: none; }
.cta-section::after { content: ''; position: absolute; top: 24px; left: 24px; right: 24px; bottom: 24px; border: 1px solid var(--border); border-radius: 16px; pointer-events: none; }
.cta-inner { position: relative; z-index: 1; }
.cta-pixel-label { font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--gold); letter-spacing: 2px; margin-bottom: 24px; display: block; opacity: 0.7; }
.cta-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(36px,5vw,60px); letter-spacing: -2px; color: var(--text); margin-bottom: 20px; line-height: 1; }
.cta-sub { font-size: 18px; color: var(--text2); max-width: 440px; margin: 0 auto 40px; font-weight: 300; }
footer { background: var(--bg2); border-top: 1px solid var(--border); padding: 48px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
.footer-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: var(--text); letter-spacing: -0.5px; }
.footer-logo em { color: var(--gold); font-style: normal; }
.footer-links { display: flex; gap: 28px; }
.footer-links a { font-size: 13px; color: var(--text2); text-decoration: none; transition: color 0.2s; }
.footer-links a:hover { color: var(--text); }
.footer-copy { font-family: 'Press Start 2P', monospace; font-size: 6px; color: var(--text3); letter-spacing: 0.5px; }
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
@media (max-width: 900px) { nav ul{display:none} nav{padding:0 24px} section{padding:72px 24px} .testi-grid{grid-template-columns:1fr} footer{flex-direction:column;align-items:flex-start} .mini-grid{grid-template-columns:repeat(5,62px);grid-template-rows:repeat(3,62px)} }
`
