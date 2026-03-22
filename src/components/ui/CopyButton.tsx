'use client'

import { useState } from 'react'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '7px',
        padding: '8px 16px',
        borderRadius: '6px',
        border: copied ? '1px solid rgba(62,207,116,0.4)' : '1px solid rgba(232,184,75,0.3)',
        background: copied ? 'rgba(62,207,116,0.1)' : 'rgba(232,184,75,0.08)',
        color: copied ? 'var(--green)' : 'var(--gold)',
        cursor: 'pointer',
        transition: 'all .2s',
        letterSpacing: '1px',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ COPIED' : label}
    </button>
  )
}
