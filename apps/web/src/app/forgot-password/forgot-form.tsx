'use client'

import { useState, useTransition } from 'react'
import { isFirebaseConfigured, sendPasswordReset } from '@/lib/firebase-client'

const RATE_LIMIT_KEY = 'ch_password_reset_attempts'
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

interface AttemptLog {
  attempts: number[]
}

function readLog(): AttemptLog {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY)
    if (!raw) return { attempts: [] }
    const parsed = JSON.parse(raw) as AttemptLog
    if (!Array.isArray(parsed.attempts)) return { attempts: [] }
    return parsed
  } catch {
    return { attempts: [] }
  }
}

function checkRateLimit(): { allowed: boolean; remainingMs: number } {
  if (typeof window === 'undefined') return { allowed: true, remainingMs: 0 }
  const log = readLog()
  const now = Date.now()
  log.attempts = log.attempts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (log.attempts.length >= RATE_LIMIT_MAX) {
    const oldest = log.attempts[0] ?? now
    return { allowed: false, remainingMs: RATE_LIMIT_WINDOW_MS - (now - oldest) }
  }
  return { allowed: true, remainingMs: 0 }
}

function recordAttempt(): void {
  const log = readLog()
  log.attempts.push(Date.now())
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(log))
  } catch {
    // localStorage full / disabled / private mode — best-effort only
  }
}

export function ForgotForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const fbReady = isFirebaseConfigured()

  function submit(e: React.SyntheticEvent) {
    e.preventDefault()
    setError(null)
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email')
      return
    }
    const limit = checkRateLimit()
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.remainingMs / 60_000)
      setError(`Too many attempts — try again in ${String(minutes)} min`)
      return
    }
    if (!fbReady) {
      setError('Password reset not available in dev — set Firebase env vars')
      return
    }
    startTransition(async () => {
      try {
        await sendPasswordReset(email)
        recordAttempt()
        setSent(true)
      } catch (err) {
        // We always show success to avoid enumerating which emails exist.
        // But log the actual reason locally for debugging.
        if (typeof window !== 'undefined') console.warn('reset failed', err)
        recordAttempt()
        setSent(true)
      }
    })
  }

  if (sent) {
    return (
      <div
        role="status"
        style={{
          background: 'var(--primary-tint)',
          color: 'var(--primary-deep)',
          padding: 16,
          borderRadius: 'var(--radius-md)',
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        If an account exists for <strong>{email}</strong>, we&rsquo;ve sent a reset link. Check your
        inbox — the link expires in one hour.
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}
        >
          Email
        </span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
          }}
          placeholder="you@example.com"
          required
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--hairline-strong)',
            background: 'var(--surface)',
            fontSize: 15,
            color: 'var(--ink)',
            fontFamily: 'inherit',
          }}
        />
      </label>
      <button
        type="submit"
        className="ch-btn ch-btn-primary"
        style={{ padding: '14px 20px' }}
        disabled={pending}
      >
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
      {error && (
        <div
          role="alert"
          style={{
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            color: 'var(--danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      <p style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 4 }}>
        3 reset attempts per hour. Tokens expire in 1 hour, single use.
      </p>
    </form>
  )
}
