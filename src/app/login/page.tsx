import { Suspense } from 'react'
import { LoginClient } from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-pixel text-[8px] text-gold-dim animate-pulse">LOADING…</div>
      </div>
    }>
      <LoginClient />
    </Suspense>
  )
}
