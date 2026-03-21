'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded font-syne font-bold text-sm bg-gold text-bg hover:bg-[#f0c85a] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className ?? ''}`}
    >
      {pending ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Working…
        </>
      ) : children}
    </button>
  )
}
