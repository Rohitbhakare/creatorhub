'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useSignInModal } from '@/components/auth/sign-in-modal-provider'

interface LikeButtonProps {
  contentId: string
  contentTitle?: string
  initialLiked?: boolean
  initialCount?: number
  isAuthenticated: boolean
}

export function LikeButton({
  contentId,
  contentTitle,
  initialLiked = false,
  initialCount = 0,
  isAuthenticated,
}: LikeButtonProps) {
  const { openSignInModal } = useSignInModal()
  const reduced = useReducedMotion()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [pending, startTransition] = useTransition()

  // Sync local state when server-provided props change (sibling action
  // triggers revalidation). See save-button.tsx for the rationale.
  const prevInitialLikedRef = useRef(initialLiked)
  const prevInitialCountRef = useRef(initialCount)
  useEffect(() => {
    if (initialLiked !== prevInitialLikedRef.current) {
      setLiked(initialLiked)
      prevInitialLikedRef.current = initialLiked
    }
    if (initialCount !== prevInitialCountRef.current) {
      setCount(initialCount)
      prevInitialCountRef.current = initialCount
    }
  }, [initialLiked, initialCount])

  function doLike(target: boolean) {
    setLiked(target)
    setCount((c) => Math.max(0, c + (target ? 1 : -1)))
    startTransition(async () => {
      try {
        const res = await fetch('/api/social/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ contentId, like: target }),
        })
        if (!res.ok) throw new Error('like-failed')
      } catch {
        setLiked(!target)
        setCount((c) => Math.max(0, c + (target ? -1 : 1)))
      }
    })
  }

  function handleClick() {
    if (!isAuthenticated) {
      const truncated = contentTitle && contentTitle.length > 40
        ? `${contentTitle.slice(0, 39)}…`
        : contentTitle
      openSignInModal({
        contextLabel: truncated ? `Like “${truncated}”` : 'Like this story',
        reason: 'Likes signal what travellers love — they shape what gets surfaced.',
        onSuccess: () => {
          doLike(true)
        },
      })
      return
    }
    doLike(!liked)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      disabled={pending}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 999,
        background: 'transparent',
        border: 0,
        color: liked ? 'var(--primary)' : 'var(--ink-soft)',
        fontWeight: 500,
        fontSize: 13.5,
        cursor: pending ? 'progress' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <motion.span
        animate={liked && !reduced ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.32 }}
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </motion.span>
      {count > 0 && <span>{Intl.NumberFormat('en-IN', { notation: 'compact' }).format(count)}</span>}
    </button>
  )
}
