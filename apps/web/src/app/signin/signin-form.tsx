'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { ConfirmationResult } from 'firebase/auth'
import {
  isFirebaseConfigured,
  sendPhoneOtp,
  signInWithGoogle,
  verifyPhoneOtp,
} from '@/lib/firebase-client'

type Mode = 'phone' | 'otp'

interface SignInFormProps {
  next: string
}

/**
 * Sign-in form — phone OTP (real via Firebase) + Google OAuth.
 *
 * Falls back to a dev-stub flow when Firebase env vars aren't set, so we can
 * exercise the cookie/session path without a Firebase project. The stub
 * token will be rejected by the API in production.
 */
export function SignInForm({ next }: SignInFormProps) {
  const router = useRouter()
  const fbReady = isFirebaseConfigured()
  const [mode, setMode] = useState<Mode>('phone')
  const [phone, setPhone] = useState('+91 ')
  const [otp, setOtp] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function sendOtp(e: React.SyntheticEvent) {
    e.preventDefault()
    setError(null)
    const e164 = phone.replace(/\s+/g, '')
    if (!/^\+\d{12,13}$/.test(e164)) {
      setError('Enter a valid phone with country code')
      return
    }
    if (fbReady) {
      startTransition(async () => {
        try {
          const { confirmation: c } = await sendPhoneOtp(e164)
          setConfirmation(c)
          setMode('otp')
        } catch (err) {
          setError(friendly(err) || 'Could not send code — try again')
        }
      })
    } else {
      // Dev stub — skip Firebase, jump to OTP screen.
      setMode('otp')
    }
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
        const idToken = fbReady && confirmation
          ? await verifyPhoneOtp(confirmation, otp)
          : `dev-stub-${otp}-${phone.replace(/\D/g, '')}`
        await postSignin(idToken, next, router, setError)
      } catch (err) {
        setError(friendly(err) || 'Invalid code — try again')
      }
    })
  }

  function handleGoogle() {
    setError(null)
    startTransition(async () => {
      try {
        const idToken = await signInWithGoogle()
        await postSignin(idToken, next, router, setError)
      } catch (err) {
        setError(friendly(err) || 'Google sign-in failed')
      }
    })
  }

  if (mode === 'phone') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {fbReady && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={pending}
              className="ch-btn ch-btn-ghost"
              style={{ padding: '14px 20px', fontWeight: 600 }}
            >
              <GoogleGlyph /> Continue with Google
            </button>
            <Divider />
          </>
        )}

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
            By continuing you agree to our{' '}
            <Link href="/terms" style={{ color: 'var(--ink-soft)' }}>
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: 'var(--ink-soft)' }}>
              Privacy
            </Link>
            .
          </p>
        </form>

        {fbReady && (
          <div style={{ textAlign: 'center', fontSize: 12, marginTop: 4 }}>
            <Link
              href="/forgot-password"
              style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </div>
        )}

        {!fbReady && (
          <p
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              textAlign: 'center',
              padding: '8px 12px',
              border: '1px dashed var(--hairline)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            Dev mode — Firebase not configured. Any phone + 6-digit code will reach the API.
          </p>
        )}
      </div>
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
            setConfirmation(null)
            setOtp('')
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

async function postSignin(
  idToken: string,
  next: string,
  router: ReturnType<typeof useRouter>,
  setError: (msg: string | null) => void,
) {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      firebase_token: idToken,
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
  const data = (await res.json()) as { onboardingComplete?: boolean }
  // First-time users land on sub-cat picker; existing users go to `next`.
  router.replace(data.onboardingComplete === false ? '/onboarding/sub-categories' : next)
  router.refresh()
}

function friendly(err: unknown): string | null {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: unknown }).code)
    if (code.includes('too-many-requests')) return 'Too many attempts — wait a minute'
    if (code.includes('invalid-verification')) return 'That code looks wrong'
    if (code.includes('popup-closed')) return 'Google sign-in cancelled'
    if (code.includes('network')) return 'Network error — please retry'
  }
  return null
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

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-muted)' }}>
      <hr className="ch-divider" style={{ flex: 1 }} />
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em' }}>OR</span>
      <hr className="ch-divider" style={{ flex: 1 }} />
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.3 0 10.1-2 13.7-5.4l-6.3-5.2C29.5 35 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.2C41.4 35.9 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
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
