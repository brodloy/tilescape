import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-content-center gap-2 font-syne font-bold tracking-tight rounded transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'

    const variants = {
      primary: 'bg-gold text-bg hover:bg-[#f0c85a] shadow-[0_0_20px_rgba(232,184,75,0.2)] hover:shadow-[0_0_32px_rgba(232,184,75,0.35)] hover:-translate-y-px',
      ghost:   'bg-transparent text-text-2 border border-[rgba(232,184,75,0.20)] hover:text-text hover:border-gold-dim hover:bg-[rgba(232,184,75,0.06)]',
      outline: 'bg-surface text-text border border-[rgba(232,184,75,0.20)] hover:border-[rgba(232,184,75,0.35)] hover:bg-surface2',
      danger:  'bg-[rgba(232,85,85,0.1)] text-red border border-[rgba(232,85,85,0.2)] hover:bg-[rgba(232,85,85,0.18)]',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-8',
      md: 'text-sm px-4 py-2 h-10',
      lg: 'text-base px-6 py-3 h-12',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
