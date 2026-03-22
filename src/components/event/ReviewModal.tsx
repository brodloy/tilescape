'use client'

import { useState } from 'react'
import { reviewCompletion } from '@/app/actions/completions'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  proof_url: string
  status: string
  submitted_at: string
  tiles: { name: string; sprite_url?: string }
  teams: { name: string; color: string }
  users: { id: string; display_name: string; avatar_url?: string }
}

interface Props {
  submission: Submission
  onClose: () => void
  onDone: () => void
}

export function ReviewModal({ submission, onClose, onDone }: Props) {
  const [rejecting, setRejecting] = useState(false)
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const router = useRouter()

  async function handleApprove() {
    setLoading('approve')
    await reviewCompletion(submission.id, 'approved')
    setLoading(null)
    onDone()
    router.refresh()
  }

  async function handleReject() {
    setLoading('reject')
    await reviewCompletion(submission.id, 'rejected')
    setLoading(null)
    onDone()
    router.refresh()
  }

  const date = new Date(submission.submitted_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg2)', border: '1px solid rgba(232,184,75,0.2)', borderRadius: '18px', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(232,184,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {submission.tiles.sprite_url && (
              <img src={submission.tiles.sprite_url} alt={submission.tiles.name}
                style={{ width: '36px', height: '36px', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))' }} />
            )}
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '18px', color: '#f0e8d8', letterSpacing: '-0.3px' }}>{submission.tiles.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: submission.teams.color, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#9a8f7a' }}>{submission.teams.name} · {submission.users.display_name}</span>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '7px', color: '#4a4438' }}>{date}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '34px', height: '34px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#9a8f7a', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Proof image */}
        <div style={{ background: 'var(--bg3)', minHeight: '280px', maxHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
          {submission.proof_url ? (
            <a href={submission.proof_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
              <img
                src={submission.proof_url}
                alt="Proof"
                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '420px' }}
                onError={e => {
                  const el = e.currentTarget as HTMLImageElement
                  el.style.display = 'none'
                  el.parentElement!.innerHTML = '<div style="padding:40px;text-align:center;color:#4a4438;font-size:14px;">Could not load image.<br/>Click to open link directly.</div>'
                }}
              />
            </a>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#4a4438' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📎</div>
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px' }}>NO PROOF URL</div>
            </div>
          )}
          {/* Open externally badge */}
          {submission.proof_url && (
            <a href={submission.proof_url} target="_blank" rel="noopener noreferrer"
              style={{ position: 'absolute', top: '10px', right: '10px', fontFamily: "'Press Start 2P',monospace", fontSize: '7px', padding: '5px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.7)', color: '#9a8f7a', textDecoration: 'none', backdropFilter: 'blur(4px)' }}>
              OPEN ↗
            </a>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 22px', display: 'flex', gap: '10px' }}>
          {!rejecting ? (
            <>
              <button onClick={() => setRejecting(true)} disabled={!!loading}
                style={{ flex: 1, height: '48px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '15px', background: 'none', border: '1px solid rgba(232,85,85,0.25)', borderRadius: '10px', color: '#e85555', cursor: 'pointer', transition: 'all .15s' }}>
                Reject
              </button>
              <button onClick={handleApprove} disabled={!!loading}
                style={{ flex: 2, height: '48px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '15px', background: '#3ecf74', border: 'none', borderRadius: '10px', color: '#041a0c', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 0 20px rgba(62,207,116,0.2)', transition: 'all .15s' }}>
                {loading === 'approve' ? 'Approving…' : '✓ Approve'}
              </button>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '14px', color: '#9a8f7a', margin: 0 }}>Are you sure you want to reject this submission?</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setRejecting(false)} style={{ flex: 1, height: '44px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', background: 'none', border: '1px solid rgba(232,184,75,0.2)', borderRadius: '10px', color: '#9a8f7a', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleReject} disabled={!!loading}
                  style={{ flex: 1, height: '44px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', background: 'rgba(232,85,85,0.1)', border: '1px solid rgba(232,85,85,0.3)', borderRadius: '10px', color: '#e85555', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading === 'reject' ? 'Rejecting…' : 'Yes, Reject'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
