'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface LikeButtonProps {
  contentId: string
  initialLiked?: boolean
  initialCount?: number
  isAuthenticated: boolean
}

export function LikeButton({
  contentId,
  initialLiked = false,
  initialCount = 0,
  isAuthenticated,
}: LikeButtonProps) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/signin?next=${window.location.pathname}`)
      return
    }
    const next = !liked
    setLiked(next)
    setCount((c) => Math.max(0, c + (next ? 1 : -1)))
    startTransition(async () => {
      try {
        const res = await fetch('/api/social/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ contentId, like: next }),
        })
        if (!res.ok) throw new Error('like-failed')
      } catch {
        setLiked(!next)
        setCount((c) => Math.max(0, c + (next ? -1 : 1)))
      }
    })
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
