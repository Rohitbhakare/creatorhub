'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useState, useTransition } from 'react'
import { useSignInModal } from '@/components/auth/sign-in-modal-provider'

interface FollowButtonProps {
  creatorId: string
  /** Display name used in the contextual sign-in modal copy. */
  creatorName?: string
  initialFollowing?: boolean
  /** Initial follower count — shown beside the label. */
  initialFollowerCount?: number
  isAuthenticated: boolean
  /** 'md' (default) for the profile page; 'sm' for inline use beside an avatar. */
  size?: 'md' | 'sm'
  /** Hide the follower count tail. Useful in compact rails where the count is shown elsewhere. */
  hideCount?: boolean
}

export function FollowButton({
  creatorId,
  creatorName,
  initialFollowing = false,
  initialFollowerCount = 0,
  isAuthenticated,
  size = 'md',
  hideCount = false,
}: FollowButtonProps) {
  const { openSignInModal } = useSignInModal()
  const reduced = useReducedMotion()
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialFollowerCount)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [hover, setHover] = useState(false)

  function doFollow(target: boolean) {
    setFollowing(target)
    setCount((c) => Math.max(0, c + (target ? 1 : -1)))
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/social/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ creatorId, follow: target }),
        })
        if (!res.ok) throw new Error('follow-failed')
      } catch {
        setFollowing(!target)
        setCount((c) => Math.max(0, c + (target ? -1 : 1)))
        setError('Try again')
      }
    })
  }

  function handleClick() {
    if (!isAuthenticated) {
      openSignInModal({
        contextLabel: creatorName ? `Follow ${creatorName}` : 'Follow this creator',
        reason: 'Get their new stories in your feed and notifications.',
        onSuccess: () => {
          doFollow(true)
        },
      })
      return
    }
    doFollow(!following)
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
        padding: size === 'sm' ? '6px 12px' : '10px 18px',
        borderRadius: 999,
        fontWeight: 600,
        fontSize: size === 'sm' ? 12 : 13.5,
        border: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
        background: following
          ? hover
            ? 'color-mix(in srgb, var(--danger) 12%, var(--surface))'
            : 'var(--surface)'
          : 'var(--primary-text-bg, var(--primary))',
        color: following ? (hover ? 'var(--danger)' : 'var(--ink)') : 'white',
        boxShadow: following ? 'inset 0 0 0 1.5px var(--hairline-strong)' : 'none',
        transition: 'all 180ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {label}
      {!hideCount && count > 0 && (
        <span
          aria-label={`${String(count)} followers`}
          style={{
            marginLeft: 8,
            fontSize: size === 'sm' ? 11 : 12,
            opacity: 0.85,
            fontWeight: 500,
          }}
        >
          · {formatCount(count)}
        </span>
      )}
      {error && (
        <span style={{ marginLeft: 8, color: 'var(--danger)', fontSize: 11 }} role="alert">
          {error}
        </span>
      )}
    </motion.button>
  )
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n < 1_000_000) return `${String(Math.round(n / 1000))}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}
