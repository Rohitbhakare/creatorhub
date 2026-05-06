'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface Props {
  initialDisplayName: string
  initialUsername: string
}

const DISPLAY_NAME_MIN = 2
const DISPLAY_NAME_MAX = 60
const USERNAME_MIN = 3
const USERNAME_MAX = 20
const USERNAME_RE = /^[a-z0-9]+$/

/**
 * Round-6 audit C1: client-side form for the new /onboarding/profile
 * step. Real-time client validation only — uniqueness is enforced by
 * upstream `/api/v1/users/me` which 409s on collision (we surface that
 * inline as "Handle's taken — pick another"). When a future
 * `/api/onboarding/username-available` lands we'll wire a debounced
 * lookup, but the 409 path is the source of truth either way.
 */
export function ProfileForm({ initialDisplayName, initialUsername }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [username, setUsername] = useState(initialUsername)
  const [error, setError] = useState<string | null>(null)

  const trimmedName = displayName.trim()
  const trimmedHandle = username.trim().toLowerCase()
  const nameOk = trimmedName.length >= DISPLAY_NAME_MIN && trimmedName.length <= DISPLAY_NAME_MAX
  const handleOk =
    trimmedHandle.length >= USERNAME_MIN &&
    trimmedHandle.length <= USERNAME_MAX &&
    USERNAME_RE.test(trimmedHandle)

  const ready = nameOk && handleOk

  function submit() {
    setError(null)
    if (!ready) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/onboarding/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ display_name: trimmedName, username: trimmedHandle }),
        })
        if (res.status === 409) {
          setError('That handle is taken — pick another.')
          return
        }
        if (!res.ok) {
          setError(friendlyError(res.status))
          return
        }
        router.replace('/onboarding/sub-categories')
        router.refresh()
      } catch {
        setError('Network error — please retry.')
      }
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      <Field
        label="Display name"
        hint={`${String(DISPLAY_NAME_MIN)}–${String(DISPLAY_NAME_MAX)} characters. Use the name people will recognise.`}
      >
        <input
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value)
            if (error) setError(null)
          }}
          maxLength={DISPLAY_NAME_MAX}
          autoFocus
          autoComplete="name"
          placeholder="e.g. Aanya Mehta"
          style={inputStyle}
        />
      </Field>
      <Field
        label="Handle"
        hint={`Your @handle. Lowercase letters and numbers only, ${String(USERNAME_MIN)}–${String(USERNAME_MAX)} chars.`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--ink-muted)', fontSize: 16 }}>@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')
              setUsername(cleaned)
              if (error) setError(null)
            }}
            minLength={USERNAME_MIN}
            maxLength={USERNAME_MAX}
            placeholder="aanyam"
            autoComplete="username"
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
      </Field>

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            color: 'var(--danger)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        className="ch-btn ch-btn-primary"
        disabled={pending || !ready}
        title={!ready ? 'Fill both fields to continue' : undefined}
        style={{ alignSelf: 'flex-start', padding: '12px 24px' }}
      >
        {pending ? 'Saving…' : 'Continue'}
      </button>
    </form>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
        }}
      >
        {label}
      </span>
      {children}
      <span style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.5 }}>{hint}</span>
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--hairline)',
  background: 'var(--surface)',
  fontSize: 15,
  color: 'var(--ink)',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
}

function friendlyError(status: number): string {
  if (status === 401 || status === 403) {
    return 'Your session timed out. Refresh and try again.'
  }
  if (status >= 500) return 'Something went wrong on our end. Give it a moment and retry.'
  return "Couldn't save — check your inputs and try again."
}
