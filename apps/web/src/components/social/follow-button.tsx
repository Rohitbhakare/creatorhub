'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface FollowButtonProps {
  creatorId: string
  initialFollowing?: boolean
  isAuthenticated: boolean
}

export function FollowButton({
  creatorId,
  initialFollowing = false,
  isAuthenticated,
}: FollowButtonProps) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [following, setFollowing] = useState(initialFollowing)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [hover, setHover] = useState(false)

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/signin?next=${window.location.pathname}`)
      return
    }
    const next = !following
    setFollowing(next)
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/social/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ creatorId, follow: next }),
        })
        if (!res.ok) throw new Error('follow-failed')
      } catch {
        setFollowing(!next)
        setError('Try again')
      }
    })
  }

  const label = !following ? 'Follow' : hover ? 'Unfollow' : 'Following ✓'

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => {
        setHover(true)
      }}
      onMouseLeave={() => {
        setHover(false)
      }}
      disabled={pending}
      aria-pressed={following}
      {...(reduced ? {} : { whileTap: { scale: 0.97 } })}
      style={{
        padding: '10px 18px',
        borderRadius: 999,
        fontWeight: 600,
        fontSize: 13.5,
        border: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
        background: following
          ? hover
            ? 'color-mix(in srgb, var(--danger) 12%, var(--surface))'
            : 'var(--surface)'
          : 'var(--primary)',
        color: following ? (hover ? 'var(--danger)' : 'var(--ink)') : 'white',
        boxShadow: following ? 'inset 0 0 0 1.5px var(--hairline-strong)' : 'none',
        transition: 'all 180ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {label}
      {error && (
        <span style={{ marginLeft: 8, color: 'var(--danger)', fontSize: 11 }} role="alert">
          {error}
        </span>
      )}
    </motion.button>
  )
}
