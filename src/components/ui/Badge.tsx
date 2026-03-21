import { cn } from '@/lib/utils'

type BadgeVariant = 'gold' | 'green' | 'purple' | 'red' | 'blue' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  gold:   'bg-[rgba(232,184,75,0.12)] text-gold border-[rgba(232,184,75,0.25)]',
  green:  'bg-[rgba(62,207,116,0.10)] text-green border-[rgba(62,207,116,0.25)]',
  purple: 'bg-[rgba(168,117,240,0.12)] text-purple border-[rgba(168,117,240,0.25)]',
  red:    'bg-[rgba(232,85,85,0.10)] text-red border-[rgba(232,85,85,0.25)]',
  blue:   'bg-[rgba(75,158,240,0.10)] text-[#4b9ef0] border-[rgba(75,158,240,0.25)]',
  gray:   'bg-surface2 text-text-2 border-[rgba(255,255,255,0.08)]',
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-pixel text-[6px] tracking-wide px-2 py-1 rounded border',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' | 'draft' | 'live' | 'ended' }) {
  const map = {
    pending:  { variant: 'gold'   as BadgeVariant, label: 'PENDING'  },
    approved: { variant: 'green'  as BadgeVariant, label: 'APPROVED' },
    rejected: { variant: 'red'    as BadgeVariant, label: 'REJECTED' },
    draft:    { variant: 'gray'   as BadgeVariant, label: 'DRAFT'    },
    live:     { variant: 'green'  as BadgeVariant, label: '● LIVE'   },
    ended:    { variant: 'gray'   as BadgeVariant, label: 'ENDED'    },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}
