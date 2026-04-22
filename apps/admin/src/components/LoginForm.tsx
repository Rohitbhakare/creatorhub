'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch, ClientApiError } from '../lib/api'
import type { AdminProfile } from '../lib/types'

interface LoginResponse {
  admin: AdminProfile
  must_change_password: boolean
}

export function LoginForm(): React.JSX.Element {
  const router = useRouter()
  const params = useSearchParams()
  const returnTo = params.get('returnTo') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(): Promise<void> {
    setError(null)
    setSubmitting(true)
    try {
      const data = await apiFetch<LoginResponse>('/admin/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      const dest = data.must_change_password ? '/change-password' : returnTo
      router.replace(dest)
      router.refresh()
    } catch (err) {
      if (err instanceof ClientApiError) {
        if (err.status === 423) setError('Account locked. Try again later.')
        else if (err.status === 403)
          setError('Account inactive or not provisioned.')
        else setError('Invalid email or password.')
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
        <span className="font-medium">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
          }}
          className="border rounded-md px-3 py-2 outline-none"
          style={{ borderColor: 'var(--color-border-strong)' }}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
          }}
          className="border rounded-md px-3 py-2 outline-none"
          style={{ borderColor: 'var(--color-border-strong)' }}
        />
      </label>

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
        disabled={submitting}
        className="rounded-md py-2 font-medium text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: 'var(--color-coral)' }}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
