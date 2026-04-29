'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface SaveButtonProps {
  contentId: string
  initialSaved?: boolean
  isAuthenticated: boolean
  /** When false, click leads to /signin?next=… */
  signInHref?: string
}

export function SaveButton({
  contentId,
  initialSaved = false,
  isAuthenticated,
  signInHref,
}: SaveButtonProps) {
  const reduced = useReducedMotion()
  const [saved, setSaved] = useState(initialSaved)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    if (!isAuthenticated) {
      router.push(signInHref ?? `/signin?next=/content/${contentId}`)
      return
    }

    const next = !saved
    setSaved(next) // optimistic
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ contentId, save: next }),
        })
        if (!res.ok) throw new Error('save-failed')
      } catch {
        setSaved(!next) // revert
        setError('Could not save — try again')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? 'Unsave' : 'Save'}
      disabled={pending}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 14px',
        borderRadius: 999,
        border: `1.5px solid ${saved ? 'var(--primary)' : 'var(--hairline-strong)'}`,
        background: saved ? 'var(--primary-tint)' : 'var(--surface)',
        color: saved ? 'var(--primary-deep)' : 'var(--ink)',
        fontWeight: 600,
        fontSize: 13.5,
        cursor: pending ? 'progress' : 'pointer',
        transition: 'all 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        position: 'relative',
      }}
    >
      <motion.span
        animate={saved && !reduced ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'inline-flex' }}
        aria-hidden
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </motion.span>
      <span>{saved ? 'Saved' : 'Save'}</span>
      {error && (
        <span
          role="alert"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            fontSize: 11,
            color: 'var(--danger)',
            whiteSpace: 'nowrap',
          }}
        >
          {error}
        </span>
      )}
    </button>
  )
}
