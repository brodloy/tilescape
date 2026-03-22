'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, syncDiscordAvatar } from '@/app/actions/forms'
import { signOut } from '@/app/actions/auth'

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.12)', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }
const cardHead: React.CSSProperties = { padding: '16px 22px', borderBottom: '1px solid rgba(232,184,75,0.08)' }
const fieldLabel: React.CSSProperties = { display: 'block', fontFamily: "'Press Start 2P',monospace", fontSize: '9px', color: '#6a5c3e', letterSpacing: '1px', marginBottom: '10px' }
const inputStyle: React.CSSProperties = { width: '100%', height: '46px', padding: '0 14px', background: 'var(--bg3)', border: '1px solid rgba(232,184,75,0.2)', borderRadius: '8px', color: 'var(--text)', fontSize: '15px', outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border .15s' }
const goldBtn: React.CSSProperties = { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: '#e8b84b', color: '#0c0a08', transition: 'all .15s' }
const ghostBtn: React.CSSProperties = { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', background: 'none', border: '1px solid rgba(232,184,75,0.2)', color: '#9a8f7a', transition: 'all .15s' }
const dangerBtn: React.CSSProperties = { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', padding: '10px 22px', borderRadius: '8px', cursor: 'not-allowed', background: 'rgba(232,85,85,0.08)', border: '1px solid rgba(232,85,85,0.2)', color: '#e85555', opacity: 0.5 }

interface Props {
  displayName: string
  email: string
  isDiscord: boolean
  avatarUrl: string | null
}

export function AccountClient({ displayName, email, isDiscord, avatarUrl }: Props) {
  const router = useRouter()
  const [name, setName] = useState(displayName)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')
  const [syncing, startSync] = useTransition()
  const [syncMsg, setSyncMsg] = useState('')
  const [saving, startSave] = useTransition()

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setNameError('Name cannot be empty'); return }
    if (trimmed.length > 12) { setNameError('Max 12 characters'); return }
    setNameError('')
    startSave(async () => {
      const fd = new FormData()
      fd.set('display_name', trimmed)
      await updateProfile(fd)
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2500)
      router.refresh()
    })
  }

  function handleSyncAvatar() {
    setSyncMsg('')
    startSync(async () => {
      const result = await syncDiscordAvatar()
      if (result?.error) setSyncMsg(result.error)
      else { setSyncMsg('Avatar synced from Discord!'); router.refresh() }
      setTimeout(() => setSyncMsg(''), 3000)
    })
  }

  return (
    <>
      {/* Display Name */}
      <div style={card}>
        <div style={cardHead}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: 'var(--text)' }}>Display Name</div>
        </div>
        <form onSubmit={handleSaveName} style={{ padding: '22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={fieldLabel}>RUNESCAPE NAME (RSN)</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Zezima"
              maxLength={12}
              style={inputStyle}
            />
            <div style={{ fontSize: '13px', color: '#4a4438', marginTop: '6px' }}>Max 12 characters · shown on boards and in member lists</div>
            {nameError && <div style={{ fontSize: '13px', color: '#e85555', marginTop: '6px' }}>{nameError}</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{ ...goldBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : nameSaved ? '✓ Saved!' : 'Save Name'}
            </button>
          </div>
        </form>
      </div>

      {/* Discord / Avatar */}
      {isDiscord && (
        <div style={card}>
          <div style={cardHead}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: 'var(--text)' }}>Discord Avatar</div>
          </div>
          <div style={{ padding: '22px' }}>
            <p style={{ fontSize: '14px', color: '#9a8f7a', marginBottom: '16px', lineHeight: 1.6 }}>
              Your avatar is pulled from Discord on sign-in. If you've changed it recently, sync it here.
            </p>
            {syncMsg && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', background: syncMsg.includes('!') ? 'rgba(62,207,116,0.08)' : 'rgba(232,85,85,0.08)', border: `1px solid ${syncMsg.includes('!') ? 'rgba(62,207,116,0.2)' : 'rgba(232,85,85,0.2)'}`, fontSize: '14px', color: syncMsg.includes('!') ? '#3ecf74' : '#e85555' }}>
                {syncMsg}
              </div>
            )}
            <button onClick={handleSyncAvatar} disabled={syncing} style={{ ...ghostBtn, opacity: syncing ? 0.7 : 1 }}>
              {syncing ? 'Syncing…' : '↻ Sync Avatar from Discord'}
            </button>
          </div>
        </div>
      )}

      {/* Email info */}
      <div style={card}>
        <div style={cardHead}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: 'var(--text)' }}>Account</div>
        </div>
        <div style={{ padding: '22px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={fieldLabel}>SIGNED IN AS</div>
            <div style={{ fontSize: '15px', color: '#9a8f7a' }}>{email || 'Discord account'}</div>
          </div>
          {isDiscord && (
            <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '8px', background: 'rgba(88,101,242,0.06)', border: '1px solid rgba(88,101,242,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="12" viewBox="0 0 18 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M15.246 1.177A14.9 14.9 0 0011.55.033a.056.056 0 00-.059.028c-.16.285-.337.657-.461.949a13.75 13.75 0 00-4.062 0 9.596 9.596 0 00-.468-.949.058.058 0 00-.059-.028 14.858 14.858 0 00-3.696 1.144.052.052 0 00-.024.021C.444 4.669-.265 8.059.082 11.406a.062.062 0 00.023.042 14.963 14.963 0 004.496 2.272.058.058 0 00.063-.021c.347-.473.655-.972.92-1.496a.057.057 0 00-.031-.08 9.851 9.851 0 01-1.407-.671.058.058 0 01-.006-.096c.095-.071.19-.144.28-.219a.055.055 0 01.058-.008c2.952 1.347 6.15 1.347 9.066 0a.055.055 0 01.059.007c.09.075.184.149.28.22a.058.058 0 01-.005.095 9.242 9.242 0 01-1.408.67.057.057 0 00-.03.082c.27.523.578 1.022.918 1.495a.057.057 0 00.063.022 14.92 14.92 0 004.503-2.272.058.058 0 00.024-.041c.375-3.877-.628-7.241-2.659-10.208a.046.046 0 00-.023-.021z" fill="#5865F2"/>
              </svg>
              <span style={{ fontSize: '14px', color: '#5865F2' }}>Authenticated via Discord</span>
            </div>
          )}
        </div>
      </div>

      {/* Sign out */}
      <div style={{ marginBottom: '16px' }}>
        <form action={signOut}>
          <button type="submit" style={ghostBtn}>Sign out</button>
        </form>
      </div>

      {/* Danger zone */}
      <div style={{ ...card, border: '1px solid rgba(232,85,85,0.2)', marginBottom: 0 }}>
        <div style={{ ...cardHead, borderBottom: '1px solid rgba(232,85,85,0.1)' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '17px', color: '#e85555' }}>Danger Zone</div>
        </div>
        <div style={{ padding: '22px' }}>
          <p style={{ fontSize: '14px', color: '#9a8f7a', marginBottom: '16px', lineHeight: 1.6 }}>
            Deleting your account is permanent. All events you own will also be deleted.
          </p>
          <button disabled style={dangerBtn}>Delete Account (coming soon)</button>
        </div>
      </div>
    </>
  )
}
