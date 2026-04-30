'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  isFirebaseConfigured,
  signInWithGoogle,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '@/lib/firebase-client'
import { reportClientError } from '@/lib/report-client-error'

interface Props {
  contextLabel: string
  reason?: string
  onClose: () => void
  onSuccess: () => void
}

/**
 * Contextual sign-in modal. Used by Save/Like/Follow/Book/Comment buttons
 * to keep guests on the page while completing auth. Mirrors the same
 * Firebase flow as /signin but in a focused modal with action-specific copy.
 *
 * Falls back to a /signin redirect if Firebase isn't configured at runtime
 * (env missing, blocked third-party scripts, etc.).
 */
export function SignInModal({ contextLabel, reason, onClose, onSuccess }: Props) {
  const reduced = useReducedMotion()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [phoneStep, setPhoneStep] = useState<'idle' | 'enter-phone' | 'enter-otp'>('idle')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  // We can't deserialize a ConfirmationResult, so keep it in a ref —
  // it survives across renders without triggering re-render.
  const confirmationRef = useRef<Awaited<ReturnType<typeof sendPhoneOtp>>['confirmation'] | null>(
    null,
  )
  const fbReady = isFirebaseConfigured()

  // Esc + click-outside to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function completeSession(idToken: string) {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        firebase_token: idToken,
        device_info: { device_id: deviceId(), device_name: 'Web', platform: 'web' },
      }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { detail?: string } | null
      throw new Error(body?.detail ?? 'Sign-in failed')
    }
    // Refresh the RSC tree so the page picks up the new session, then run
    // the deferred action (save/like/etc).
    router.refresh()
    onSuccess()
  }

  function handleGoogle() {
    setError(null)
    startTransition(async () => {
      try {
        const token = await signInWithGoogle()
        await completeSession(token)
      } catch (err) {
        reportClientError('signin-modal:google', err)
        setError(friendly(err) ?? 'Could not sign in with Google')
      }
    })
  }

  function handleSendOtp() {
    setError(null)
    if (!/^\+?[1-9]\d{7,14}$/.test(phone.replace(/\s+/g, ''))) {
      setError('Enter a valid phone number with country code')
      return
    }
    startTransition(async () => {
      try {
        const result = await sendPhoneOtp(phone.startsWith('+') ? phone : `+${phone}`)
        confirmationRef.current = result.confirmation
        setPhoneStep('enter-otp')
      } catch (err) {
        reportClientError('signin-modal:sendPhoneOtp', err)
        setError(friendly(err) ?? 'Could not send OTP')
      }
    })
  }

  function handleVerifyOtp() {
    setError(null)
    const confirmation = confirmationRef.current
    if (!confirmation) {
      setError('Session expired — re-send the OTP')
      setPhoneStep('enter-phone')
      return
    }
    startTransition(async () => {
      try {
        const token = await verifyPhoneOtp(confirmation, otp.trim())
        await completeSession(token)
      } catch (err) {
        reportClientError('signin-modal:verifyPhoneOtp', err)
        setError(friendly(err) ?? 'Invalid OTP')
      }
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        key="scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.18 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20, 20, 26, 0.55)',
          backdropFilter: 'blur(2px)',
          zIndex: 100,
          display: 'grid',
          placeItems: 'center',
          padding: 16,
        }}
      >
        <motion.div
          key="dialog"
          role="dialog"
          aria-label="Sign in"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 4 }}
          transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => {
            e.stopPropagation()
          }}
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'var(--bg)',
            borderRadius: 18,
            padding: 28,
            boxShadow: '0 24px 64px rgba(20,20,26,0.18)',
            border: '1px solid var(--hairline)',
            position: 'relative',
            fontFamily: 'inherit',
            color: 'var(--ink)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 6,
              borderRadius: 999,
            }}
          >
            ×
          </button>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: 8,
            }}
          >
            {contextLabel}
          </div>
          <h2
            className="ch-display"
            style={{
              fontSize: 26,
              lineHeight: 1.2,
              margin: 0,
              marginBottom: 4,
              color: 'var(--ink)',
            }}
          >
            Sign in to continue
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--ink-muted)',
              margin: 0,
              marginBottom: 18,
              lineHeight: 1.5,
            }}
          >
            {reason ?? 'Free · takes 30 seconds · no spam'}
          </p>

          {!fbReady && (
            <div
              style={{
                fontSize: 13,
                padding: 12,
                borderRadius: 10,
                background: 'var(--surface-alt)',
                color: 'var(--ink-muted)',
                marginBottom: 16,
              }}
            >
              Sign-in is temporarily unavailable in this browser. <a href="/signin">Open the full sign-in page →</a>
            </div>
          )}

          {fbReady && phoneStep !== 'enter-otp' && (
            <button
              type="button"
              onClick={handleGoogle}
              disabled={pending}
              style={googleBtnStyle(pending)}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          )}

          {fbReady && phoneStep === 'idle' && (
            <>
              <div style={dividerStyle}>
                <span>or</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhoneStep('enter-phone')
                }}
                disabled={pending}
                style={secondaryBtnStyle(pending)}
              >
                Use phone number
              </button>
            </>
          )}

          {fbReady && phoneStep === 'enter-phone' && (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle} htmlFor="ch-modal-phone">
                Phone number
              </label>
              <input
                id="ch-modal-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                }}
                placeholder="+91 98765 43210"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={pending}
                style={primaryBtnStyle(pending)}
              >
                {pending ? 'Sending…' : 'Send OTP'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhoneStep('idle')
                }}
                style={textBtnStyle}
              >
                Back
              </button>
            </div>
          )}

          {fbReady && phoneStep === 'enter-otp' && (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle} htmlFor="ch-modal-otp">
                Enter 6-digit code sent to {phone}
              </label>
              <input
                id="ch-modal-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''))
                }}
                placeholder="123456"
                style={{ ...inputStyle, letterSpacing: '0.4em', fontSize: 18, textAlign: 'center' }}
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={pending || otp.length < 6}
                style={primaryBtnStyle(pending || otp.length < 6)}
              >
                {pending ? 'Verifying…' : 'Verify & continue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhoneStep('enter-phone')
                  setOtp('')
                }}
                style={textBtnStyle}
              >
                Use a different number
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              style={{
                fontSize: 13,
                padding: 10,
                borderRadius: 8,
                background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                color: 'var(--danger)',
                marginTop: 14,
              }}
            >
              {error}
            </div>
          )}

          <p
            style={{
              fontSize: 11,
              color: 'var(--ink-muted)',
              marginTop: 18,
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            By continuing you agree to our{' '}
            <a href="/terms" style={{ color: 'inherit' }}>
              Terms
            </a>{' '}
            and{' '}
            <a href="/privacy" style={{ color: 'inherit' }}>
              Privacy Policy
            </a>
            .
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1.5px solid var(--hairline-strong)',
  background: 'var(--surface)',
  fontSize: 14,
  color: 'var(--ink)',
  marginBottom: 10,
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--ink-muted)',
  marginBottom: 6,
  fontWeight: 500,
}

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '11px 16px',
    borderRadius: 10,
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'progress' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    fontFamily: 'inherit',
    marginTop: 4,
  }
}

function secondaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '11px 16px',
    borderRadius: 10,
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: '1.5px solid var(--hairline-strong)',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'progress' : 'pointer',
    fontFamily: 'inherit',
  }
}

function googleBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '11px 16px',
    borderRadius: 10,
    background: 'var(--ink)',
    color: 'white',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'progress' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  }
}

const dividerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  margin: '14px 0',
  fontSize: 11,
  color: 'var(--ink-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  fontWeight: 600,
}

const textBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  background: 'transparent',
  color: 'var(--ink-muted)',
  border: 'none',
  fontSize: 12.5,
  cursor: 'pointer',
  marginTop: 6,
  fontFamily: 'inherit',
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
    return crypto.randomUUID()
  }
}

function friendly(err: unknown): string | null {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: unknown }).code)
    if (code.includes('too-many-requests')) return 'Too many attempts — wait a minute'
    if (code.includes('invalid-verification')) return 'That code looks wrong'
    if (code.includes('popup-closed')) return 'Google sign-in cancelled'
    if (code.includes('network')) return 'Network error — please retry'
  }
  if (err instanceof Error) return err.message
  return null
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.4 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.4c-2 1.5-4.6 2.4-7.5 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.2C41.4 35.9 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}
