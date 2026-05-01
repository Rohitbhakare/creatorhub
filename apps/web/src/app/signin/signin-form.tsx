'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { ConfirmationResult } from 'firebase/auth'
import { reportClientError } from '@/lib/report-client-error'
import {
  isFirebaseConfigured,
  sendPhoneOtp,
  // verifyPhoneOtp + signInWithGoogle imported below; helper for reporting
  // browser errors to the SSR log so the file-tail monitor catches them.
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  verifyPhoneOtp,
} from '@/lib/firebase-client'

type Tab = 'email' | 'phone' | 'google'
type Mode = 'phone' | 'otp'

interface SignInFormProps {
  next: string
  /** Renders signup-mode copy + creates an account on the email tab. Default 'signin'. */
  intent?: 'signin' | 'signup'
}

/**
 * Sign-in form — phone OTP (real via Firebase) + Google OAuth.
 *
 * Falls back to a dev-stub flow when Firebase env vars aren't set, so we can
 * exercise the cookie/session path without a Firebase project. The stub
 * token will be rejected by the API in production.
 */
export function SignInForm({ next, intent = 'signin' }: SignInFormProps) {
  const router = useRouter()
  const fbReady = isFirebaseConfigured()
  const [tab, setTab] = useState<Tab>('email')
  const [mode, setMode] = useState<Mode>('phone')
  const [phone, setPhone] = useState('+91 ')
  const [otp, setOtp] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submitEmail(e: React.SyntheticEvent): void {
    e.preventDefault()
    setError(null)
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      setError('Enter a valid email')
      return
    }
    if (intent === 'signup' && !isStrongPassword(password)) {
      setError('Use 8+ chars with at least 1 letter and 1 number')
      return
    }
    if (!fbReady) {
      // Dev stub — same shape the OTP path uses.
      const stub = `dev-stub-email-${email}`
      startTransition(async () => {
        await postSignin(stub, next, router, setError)
      })
      return
    }
    startTransition(async () => {
      try {
        const idToken =
          intent === 'signup'
            ? await signUpWithEmail(email, password)
            : await signInWithEmail(email, password)
        await postSignin(idToken, next, router, setError)
      } catch (err) {
        reportClientError(`signin:email:${intent}`, err)
        setError(friendly(err) || 'Could not sign in')
      }
    })
  }

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
          reportClientError('signin:sendPhoneOtp', err)
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
        reportClientError('signin:verifyPhoneOtp', err)
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
        reportClientError('signin:google', err)
        setError(friendly(err) || 'Google sign-in failed')
      }
    })
  }

  if (mode === 'phone') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Tab bar — Email / Phone / Google (E5.6 T2) */}
        <AuthTabs
          active={tab}
          onChange={(t) => {
            setError(null)
            setTab(t)
          }}
        />

        {tab === 'email' && (
          <form onSubmit={submitEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete={intent === 'signup' ? 'email' : 'username'}
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete={intent === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={setPassword}
              placeholder={intent === 'signup' ? 'At least 8 characters' : 'Your password'}
            />
            {intent === 'signup' && password.length > 0 && (
              <PasswordStrength password={password} />
            )}
            <button
              type="submit"
              className="ch-btn ch-btn-primary"
              style={{ padding: '14px 20px' }}
              disabled={pending}
            >
              {intent === 'signup' ? 'Create account' : 'Sign in'}
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
            {fbReady && intent === 'signin' && (
              <div style={{ textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                <Link
                  href="/forgot-password"
                  style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
            )}
          </form>
        )}

        {tab === 'phone' && (
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
        )}

        {tab === 'google' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={pending || !fbReady}
              className="ch-btn ch-btn-ghost"
              style={{ padding: '14px 20px', fontWeight: 600 }}
            >
              <GoogleGlyph /> {pending ? 'Signing in…' : 'Continue with Google'}
            </button>
            {error && <FormError message={error} />}
            {!fbReady && (
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center' }}>
                Google sign-in needs Firebase configured.
              </p>
            )}
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
            Dev mode — Firebase not configured. Form submissions hit the dev-stub path.
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
    if (code.includes('invalid-phone-number')) return 'That phone number looks wrong'
    if (code.includes('missing-phone-number')) return 'Enter a phone number first'
    if (code.includes('quota-exceeded')) return 'Daily SMS limit hit — try again tomorrow'
    if (code.includes('captcha-check-failed')) return 'reCAPTCHA failed — refresh and retry'
    if (code.includes('billing-not-enabled')) return 'Phone sign-in is misconfigured (billing) — use Google instead'
    if (code.includes('operation-not-allowed')) return 'Phone sign-in is disabled — use Google instead'
    if (code.includes('app-not-authorized')) return 'This domain isn’t authorised — try the deployed URL or use Google'
    if (code.includes('api-key-not-valid')) return 'Auth misconfigured (API key) — please contact support'
    if (code.includes('popup-closed')) return 'Google sign-in cancelled'
    if (code.includes('popup-blocked')) return 'Pop-up blocked — allow pop-ups and retry'
    if (code.includes('network')) return 'Network error — please retry'
    // Last-ditch: surface the raw Firebase code so the user (and us in
    // logs) can act on it instead of seeing a generic message.
    if (code.startsWith('auth/')) return `Sign-in error: ${code}`
  }
  if (err instanceof Error && err.message) {
    return err.message
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

function isStrongPassword(p: string): boolean {
  if (p.length < 8) return false
  if (!/[A-Za-z]/.test(p)) return false
  if (!/\d/.test(p)) return false
  return true
}

function passwordStrengthScore(p: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score: 0 | 1 | 2 | 3 | 4 = 0
  if (p.length >= 8) score = 1
  if (/[A-Za-z]/.test(p) && /\d/.test(p) && p.length >= 8) score = 2
  if (/[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && p.length >= 10) score = 3
  if (/[^A-Za-z0-9]/.test(p) && p.length >= 12) score = 4
  const labels = ['Too short', 'Weak', 'OK', 'Good', 'Strong']
  return { score, label: labels[score] ?? '' }
}

function PasswordStrength({ password }: { password: string }) {
  const { score, label } = passwordStrengthScore(password)
  const colors = ['var(--ink-muted)', 'var(--danger)', '#C68A1A', '#1D9E75', '#1D9E75'] as const
  return (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 3,
          background: 'var(--surface-alt)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${String(score * 25)}%`,
            height: '100%',
            background: colors[score],
            transition: 'width 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{label}</span>
    </div>
  )
}

interface AuthTabsProps {
  active: Tab
  onChange: (tab: Tab) => void
}

function AuthTabs({ active, onChange }: AuthTabsProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'google', label: 'Google' },
  ]
  return (
    <div
      role="tablist"
      aria-label="Sign-in method"
      style={{
        display: 'flex',
        gap: 6,
        padding: 4,
        background: 'var(--surface-alt)',
        borderRadius: 999,
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              onChange(t.id)
            }}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: 999,
              border: 'none',
              background: isActive ? 'var(--surface)' : 'transparent',
              color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
              fontWeight: isActive ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'background 180ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function deviceId(): string {
  if (typeof window === 'undefined') return 'web-server'
  try {
    let id = localStorage.getItem('ch_device_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('ch_device_id', id)
    }
    return id
  } catch {
    // private mode / disabled — return ephemeral id, sign-in still works
    return crypto.randomUUID()
  }
}
