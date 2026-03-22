'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)
  const prevPathRef = useRef(pathname + searchParams.toString())

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }

  const finish = useCallback(() => {
    clear()
    setProgress(100)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 300)
  }, [])

  // Watch for route changes completing
  useEffect(() => {
    const current = pathname + searchParams.toString()
    if (current !== prevPathRef.current) {
      prevPathRef.current = current
      finish()
    }
  }, [pathname, searchParams, finish])

  // Intercept link clicks to start the bar immediately
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      if (target.getAttribute('target') === '_blank') return

      clear()
      setProgress(0)
      setVisible(true)

      // Animate progress up to ~85% — finish() will snap to 100
      let p = 0
      progressRef.current = setInterval(() => {
        p += Math.random() * 12 + 4
        if (p > 85) {
          p = 85
          if (progressRef.current) clearInterval(progressRef.current)
        }
        setProgress(p)
      }, 150)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: '2px', pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #e8b84b, #f0c85a, #3ecf74)',
        borderRadius: '0 2px 2px 0',
        transition: progress === 100 ? 'width 0.1s ease-out, opacity 0.3s ease' : 'width 0.15s ease-out',
        opacity: progress === 100 ? 0 : 1,
        boxShadow: '0 0 8px rgba(232,184,75,0.6), 0 0 16px rgba(232,184,75,0.3)',
      }} />
    </div>
  )
}
