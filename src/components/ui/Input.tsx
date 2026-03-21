import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-12 px-4 rounded bg-surface border text-text text-sm',
            'placeholder:text-text-3 outline-none transition-all duration-150',
            'focus:border-gold-dim focus:bg-bg3 focus:shadow-[0_0_0_3px_rgba(232,184,75,0.08)]',
            error
              ? 'border-red shadow-[0_0_0_3px_rgba(232,85,85,0.1)]'
              : 'border-[rgba(232,184,75,0.20)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-text-3">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
