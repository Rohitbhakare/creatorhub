'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, ClientApiError } from '../lib/api'

// Mirror of the server-side password requirements so the user gets
// inline feedback before hitting the API. The API is still the source
// of truth — it re-validates the same rules.
function strengthErrors(pw: string): string[] {
  const errs: string[] = []
  if (pw.length < 12) errs.push('At least 12 characters')
  if (!/[a-z]/.test(pw)) errs.push('A lowercase letter')
  if (!/[A-Z]/.test(pw)) errs.push('An uppercase letter')
  if (!/\d/.test(pw)) errs.push('A number')
  if (!/[^A-Za-z0-9]/.test(pw)) errs.push('A symbol')
  return errs
}

export function ChangePasswordForm(): React.JSX.Element {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const missing = strengthErrors(next)
  const mismatch = confirm.length > 0 && next !== confirm

  async function submit(): Promise<void> {
    setError(null)
    if (missing.length > 0 || mismatch) return
    setSubmitting(true)
    try {
      await apiFetch('/admin/auth/change-password', {
        method: 'POST',
        body: { current_password: current, new_password: next },
      })
      router.replace('/')
      router.refresh()
    } catch (err) {
      if (err instanceof ClientApiError) {
        if (err.status === 401) setError('Current password is incorrect.')
        else if (err.status === 400)
          setError('Password does not meet requirements.')
        else setError('Could not update password.')
      } else {
        setError('Something went wrong. Please retry.')
      }
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="flex flex-col gap-4 w-full max-w-sm"
      noValidate
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Current password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value)
          }}
          className="border rounded-md px-3 py-2 outline-none"
          style={{ borderColor: 'var(--color-border-strong)' }}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">New password</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={next}
          onChange={(e) => {
            setNext(e.target.value)
          }}
          className="border rounded-md px-3 py-2 outline-none"
          style={{ borderColor: 'var(--color-border-strong)' }}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Confirm new password</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
          }}
          className="border rounded-md px-3 py-2 outline-none"
          style={{ borderColor: 'var(--color-border-strong)' }}
        />
      </label>

      {next.length > 0 && missing.length > 0 && (
        <ul className="text-xs list-disc pl-5">
          {missing.map((m) => (
            <li key={m} style={{ color: 'var(--color-text-muted)' }}>
              {m}
            </li>
          ))}
        </ul>
      )}

      {mismatch && (
        <p className="text-sm" style={{ color: 'var(--color-error)' }}>
          Passwords do not match.
        </p>
      )}

      {error !== null && (
        <p
          role="alert"
          className="text-sm"
          style={{ color: 'var(--color-error)' }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || missing.length > 0 || mismatch}
        className="rounded-md py-2 font-medium text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: 'var(--color-coral)' }}
      >
        {submitting ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
