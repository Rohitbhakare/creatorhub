'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useSignInModal } from '@/components/auth/sign-in-modal-provider'
import { pushToast } from '@/components/ui/toast-region'

interface SaveButtonProps {
  contentId: string
  /** Title used in the contextual sign-in modal copy. */
  contentTitle?: string
  initialSaved?: boolean
  /** Initial save count from the server — shown to authed + guest users. */
  initialCount?: number
  isAuthenticated: boolean
}

export function SaveButton({
  contentId,
  contentTitle,
  initialSaved = false,
  initialCount = 0,
  isAuthenticated,
}: SaveButtonProps) {
  const reduced = useReducedMotion()
  const [saved, setSaved] = useState(initialSaved)
  const [count, setCount] = useState(initialCount)
  const [pending, startTransition] = useTransition()
  const { openSignInModal } = useSignInModal()

  // Sync to server-provided props when they actually change. Without this,
  // a sibling action (Like / Follow / Comment) that triggers revalidation
  // would refresh the parent props but useState would keep the stale local
  // value — caught in the 2026-05-02 bug bash as "Save count reverts after
  // Like click". The ref + comparison only re-syncs when props move, so
  // the in-flight optimistic update isn't clobbered by a no-op re-render.
  const prevInitialSavedRef = useRef(initialSaved)
  const prevInitialCountRef = useRef(initialCount)
  useEffect(() => {
    if (initialSaved !== prevInitialSavedRef.current) {
      setSaved(initialSaved)
      prevInitialSavedRef.current = initialSaved
    }
    if (initialCount !== prevInitialCountRef.current) {
      setCount(initialCount)
      prevInitialCountRef.current = initialCount
    }
  }, [initialSaved, initialCount])

  function doSave(targetState: boolean) {
    setSaved(targetState)
    setCount((c) => Math.max(0, c + (targetState ? 1 : -1)))
    startTransition(async () => {
      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ contentId, save: targetState }),
        })
        if (!res.ok) throw new Error('save-failed')
      } catch {
        setSaved(!targetState)
        setCount((c) => Math.max(0, c + (targetState ? -1 : 1)))
        pushToast({ tone: 'error', message: 'Could not save — try again' })
      }
    })
  }

  function handleClick() {
    if (!isAuthenticated) {
      openSignInModal({
        contextLabel: contentTitle ? `Save “${truncate(contentTitle)}”` : 'Save this story',
        reason: "We'll keep it in your library so you can read or book it later.",
        onSuccess: () => {
          doSave(true)
        },
      })
      return
    }
    doSave(!saved)
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
      {count > 0 && (
        <span
          aria-label={`${String(count)} saves`}
          style={{
            fontSize: 12.5,
            color: saved ? 'var(--primary-deep)' : 'var(--ink-muted)',
            fontWeight: 500,
            marginLeft: 2,
          }}
        >
          · {formatCount(count)}
        </span>
      )}
    </button>
  )
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n < 1_000_000) return `${String(Math.round(n / 1000))}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

function truncate(s: string, max = 40): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}
