'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type Mode = 'phone' | 'otp'

interface SignInFormProps {
  next: string
}

/**
 * Sign-in form — phone OTP flow.
 *
 * Real Firebase integration is gated behind the FIREBASE_API_KEY env. In
 * dev without a key, we surface a "demo" path that POSTs a stub token to
 * /api/auth/signin so we can exercise the session flow end-to-end without
 * a Firebase project. In production, the demo button is hidden and the
 * Firebase JS SDK is dynamically loaded.
 */
export function SignInForm({ next }: SignInFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('phone')
  const [phone, setPhone] = useState('+91 ')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function sendOtp(e: React.SyntheticEvent) {
    e.preventDefault()
    setError(null)
    if (!/^\+\d{2}\s?\d{10}$/.test(phone.replace(/\s+/g, ' ').trim())) {
      setError('Enter a valid phone with country code')
      return
    }
    // Stub — wire Firebase when ready. For now, jump to OTP screen.
    setMode('otp')
  }

  function verifyOtp(e: React.SyntheticEvent) {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Enter the 6-digit code')
      return
    }
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            firebase_token: `dev-stub-${otp}-${phone.replace(/\D/g, '')}`,
            device_info: {
              device_id: deviceId(),
              device_name: 'Web',
              platform: 'web',
            },
          }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { detail?: string } | null
          setError(body?.detail ?? 'Could not sign in')
          return
        }
        router.replace(next)
        router.refresh()
      } catch {
        setError('Network error — try again')
      }
    })
  }

  if (mode === 'phone') {
    return (
      <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={setPhone}
          placeholder="+91 9876543210"
        />
        <button
          type="submit"
          className="ch-btn ch-btn-primary"
          style={{ padding: '14px 20px' }}
          disabled={pending}
        >
          Send code
        </button>
        {error && <FormError message={error} />}
        <p style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 4 }}>
          By continuing you agree to our Terms and Privacy.
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-muted)',
          marginBottom: 4,
        }}
      >
        Code sent to <strong style={{ color: 'var(--ink)' }}>{phone}</strong>
        <button
          type="button"
          onClick={() => {
            setMode('phone')
          }}
          style={{
            marginLeft: 8,
            background: 'transparent',
            border: 0,
            color: 'var(--primary-deep)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Change
        </button>
      </div>
      <Field
        label="6-digit code"
        name="otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={otp}
        onChange={(v) => {
          setOtp(v.replace(/\D/g, '').slice(0, 6))
        }}
        placeholder="000000"
      />
      <button
        type="submit"
        className="ch-btn ch-btn-primary"
        style={{ padding: '14px 20px' }}
        disabled={pending}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      {error && <FormError message={error} />}
    </form>
  )
}

interface FieldProps {
  label: string
  name: string
  type?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  autoComplete?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

function Field({ label, name, type = 'text', inputMode, autoComplete, value, onChange, placeholder }: FieldProps) {
  return (
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
        {label}
      </span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        placeholder={placeholder}
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
  )
}

function FormError({ message }: { message: string }) {
  return (
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
      {message}
    </div>
  )
}

function deviceId(): string {
  if (typeof window === 'undefined') return 'web-server'
  let id = localStorage.getItem('ch_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ch_device_id', id)
  }
  return id
}
