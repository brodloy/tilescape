'use client'

import { useEffect, useState } from 'react'

// ── Toast system ───────────────────────────────────────────────────────────────
export interface Toast {
  id: string
  type: 'complete' | 'purple' | 'bingo' | 'undo' | 'error'
  title: string
  subtitle?: string
}

let toastListeners: ((toasts: Toast[]) => void)[] = []
let currentToasts: Toast[] = []

export function showToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  const t: Toast = { ...toast, id }
  currentToasts = [t, ...currentToasts].slice(0, 4)
  toastListeners.forEach(l => l([...currentToasts]))
  setTimeout(() => {
    currentToasts = currentToasts.filter(x => x.id !== id)
    toastListeners.forEach(l => l([...currentToasts]))
  }, 3500)
}

export function ToastArea() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => { toastListeners = toastListeners.filter(l => l !== setToasts) }
  }, [])

  const icons: Record<Toast['type'], string> = {
    complete: '✓', purple: '⬥', bingo: '🎉', undo: '↩', error: '!'
  }
  const colors: Record<Toast['type'], string> = {
    complete: '#3ecf74', purple: '#a875f0', bingo: '#e8b84b', undo: '#9a8f7a', error: '#e85555'
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9000, display: 'flex', flexDirection: 'column-reverse', gap: '10px', pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--bg2)', border: `1px solid ${colors[t.type]}44`,
          borderLeft: `3px solid ${colors[t.type]}`,
          borderRadius: '10px', padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          minWidth: '240px', maxWidth: '320px',
          animation: 'toastIn .3s cubic-bezier(.34,1.3,.64,1)',
          pointerEvents: 'auto',
        }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${colors[t.type]}20`, border: `1px solid ${colors[t.type]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: colors[t.type], flexShrink: 0, fontWeight: 900 }}>
            {icons[t.type]}
          </div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{t.title}</div>
            {t.subtitle && <div style={{ fontSize: '12px', color: '#9a8f7a', marginTop: '2px' }}>{t.subtitle}</div>}
          </div>
          <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
        </div>
      ))}
    </div>
  )
}

// ── Bingo celebration overlay ──────────────────────────────────────────────────
interface BingoProps {
  teamName: string
  teamColor: string
  bingoCount: number
  onDismiss: () => void
}

export function BingoCelebration({ teamName, teamColor, bingoCount, onDismiss }: BingoProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      onClick={onDismiss}
      style={{ position: 'fixed', inset: 0, zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', cursor: 'pointer' }}
    >
      <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
        {/* Particle ring */}
        <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
          {Array.from({ length: 20 }, (_, i) => {
            const angle = (i / 20) * 360
            const delay = i * 0.05
            const color = ['#3ecf74','#e8b84b','#a875f0','#4b9ef0','#f0c85a'][i % 5]
            return (
              <div key={i} style={{
                position: 'absolute', top: '50%', left: '50%',
                width: '8px', height: '8px', borderRadius: '50%',
                background: color,
                transform: `rotate(${angle}deg) translateY(-120px)`,
                animation: `particlePop 0.6s ${delay}s cubic-bezier(.34,1.3,.64,1) both`,
              }} />
            )
          })}

          {/* BINGO text */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '52px', color: teamColor, textShadow: `0 0 40px ${teamColor}88, 0 0 80px ${teamColor}44, 3px 3px 0 rgba(0,0,0,0.8)`, letterSpacing: '6px', animation: 'bingoScale 0.5s 0.1s cubic-bezier(.34,1.5,.64,1) both' }}>
              BINGO!
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '20px', color: 'var(--text)', animation: 'bingoFade 0.4s 0.4s ease both' }}>
              {teamName}
            </div>
            {bingoCount > 1 && (
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '10px', color: teamColor, padding: '6px 14px', background: `${teamColor}18`, border: `1px solid ${teamColor}44`, borderRadius: '6px', animation: 'bingoFade 0.4s 0.6s ease both' }}>
                {bingoCount} BINGOS!
              </div>
            )}
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#4a4438', marginTop: '8px', animation: 'bingoFade 0.4s 1s ease both' }}>
              CLICK TO DISMISS
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes particlePop {
          from { opacity: 0; transform: rotate(var(--angle, 0deg)) translateY(-20px) scale(0); }
          to   { opacity: 1; transform: rotate(var(--angle, 0deg)) translateY(-120px) scale(1); }
        }
        @keyframes bingoScale {
          from { opacity: 0; transform: scale(0.3) rotate(-8deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes bingoFade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Tile completion animation ──────────────────────────────────────────────────
export function TileCompleteEffect({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div style={{ position: 'fixed', left: x, top: y, pointerEvents: 'none', zIndex: 7000 }}>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * 360
        const c = [color, '#3ecf74', '#e8b84b'][i % 3]
        return (
          <div key={i} style={{
            position: 'absolute', width: '6px', height: '6px', borderRadius: '50%', background: c,
            animation: `burst${i} 0.6s ease-out forwards`,
          }}>
            <style>{`@keyframes burst${i}{to{transform:translate(${Math.cos(angle*Math.PI/180)*60}px,${Math.sin(angle*Math.PI/180)*60}px);opacity:0;}}`}</style>
          </div>
        )
      })}
    </div>
  )
}
