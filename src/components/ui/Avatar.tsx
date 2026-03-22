'use client'

interface AvatarProps {
  src?: string | null
  name: string
  color?: string
  size?: number
  pixelFont?: boolean
}

export function Avatar({ src, name, color = '#e8b84b', size = 32, pixelFont = true }: AvatarProps) {
  const initials = name?.substring(0, 2).toUpperCase() ?? '??'
  const fontSize = Math.max(Math.floor(size * 0.28), 6)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: `1.5px solid ${color}55`,
        }}
        onError={e => {
          // Fall back to initials on broken image
          const el = e.currentTarget as HTMLImageElement
          el.style.display = 'none'
          const parent = el.parentElement
          if (parent) {
            const fallback = document.createElement('div')
            fallback.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color}22;border:1.5px solid ${color}55;display:flex;align-items:center;justify-content:center;font-family:'Press Start 2P',monospace;font-size:${fontSize}px;color:${color};flex-shrink:0;`
            fallback.textContent = initials
            parent.insertBefore(fallback, el)
          }
        }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: `${color}22`,
      border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: pixelFont ? "'Press Start 2P', monospace" : "'Syne', sans-serif",
      fontWeight: pixelFont ? undefined : 800,
      fontSize: fontSize,
      color,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}
