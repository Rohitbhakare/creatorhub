'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface IntentDetail {
  intent_id: string
  content_id: string
  content_title: string
  scheduled_date_id: string | null
  starts_at: string | null
  travellers: number
  expires_at: string
  pricing: {
    base_paisa: number
    platform_fee_paisa: number
    gst_paisa: number
    total_paisa: number
  }
  creator: {
    id: string
    username: string
    display_name: string
  }
}

interface Traveller {
  name: string
  email: string
  phone: string
}

type Step = 'details' | 'travellers' | 'review' | 'payment'

const STEPS: { id: Step; label: string }[] = [
  { id: 'details', label: 'Trip' },
  { id: 'travellers', label: 'Travellers' },
  { id: 'review', label: 'Review' },
  { id: 'payment', label: 'Pay' },
]

function formatPrice(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BookingWizard({ intent }: { intent: IntentDetail }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [travellers, setTravellers] = useState<Traveller[]>(
    Array.from({ length: intent.travellers }, () => ({ name: '', email: '', phone: '' })),
  )
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [holdRemaining, setHoldRemaining] = useState<number>(() =>
    Math.max(0, new Date(intent.expires_at).getTime() - Date.now()),
  )

  // Hold timer — counts down so the user can see seat-hold runtime.
  useEffect(() => {
    const id = setInterval(() => {
      const ms = Math.max(0, new Date(intent.expires_at).getTime() - Date.now())
      setHoldRemaining(ms)
      if (ms <= 0) clearInterval(id)
    }, 1000)
    return () => {
      clearInterval(id)
    }
  }, [intent.expires_at])

  // Release the hold if the user closes the tab without paying.
  useEffect(() => {
    function release() {
      navigator.sendBeacon(
        `/api/booking/cancel`,
        new Blob([JSON.stringify({ intentId: intent.intent_id })], { type: 'application/json' }),
      )
    }
    window.addEventListener('beforeunload', release)
    return () => {
      window.removeEventListener('beforeunload', release)
    }
  }, [intent.intent_id])

  const stepIdx = STEPS.findIndex((s) => s.id === step)
  const canProceed = (() => {
    if (step === 'details') return true
    if (step === 'travellers') {
      return travellers.every((t) => {
        return (
          t.name.trim().length > 0 &&
          /\S+@\S+\.\S+/.test(t.email) &&
          /^\+?\d{10,15}$/.test(t.phone.replace(/\D/g, ''))
        )
      })
    }
    if (step === 'review') return agreed
    return false
  })()

  function next() {
    setError(null)
    if (step === 'details') {
      setStep('travellers')
    } else if (step === 'travellers') {
      setStep('review')
    } else if (step === 'review') {
      startPayment()
    }
  }

  function back() {
    setError(null)
    if (step === 'travellers') {
      setStep('details')
    } else if (step === 'review') {
      setStep('travellers')
    } else if (step === 'payment') {
      setStep('review')
    }
  }

  function startPayment() {
    setStep('payment')
    startTransition(async () => {
      try {
        const res = await fetch(`/api/booking/${intent.intent_id}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ travellers }),
        })
        if (res.status === 410) {
          setError('Hold expired — please start over.')
          setStep('review')
          return
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { detail?: string } | null
          setError(body?.detail ?? 'Payment failed')
          setStep('review')
          return
        }
        const { bookingId } = (await res.json()) as { bookingId: string }
        router.replace(`/bookings/${bookingId}?just=1`)
      } catch {
        setError('Network error — try again')
        setStep('review')
      }
    })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '220px minmax(0, 1fr) 320px',
        gap: 40,
        alignItems: 'start',
      }}
    >
      <nav aria-label="Booking steps" style={{ position: 'sticky', top: 96 }}>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {STEPS.map((s, i) => {
            const isActive = step === s.id
            const isDone = i < stepIdx
            return (
              <li
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--primary-tint)' : 'transparent',
                  color: isActive ? 'var(--primary-deep)' : isDone ? 'var(--ink)' : 'var(--ink-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13.5,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: `1.5px solid ${isActive || isDone ? 'var(--primary)' : 'var(--hairline-strong)'}`,
                    background: isDone ? 'var(--primary)' : 'transparent',
                    color: isDone ? 'white' : 'inherit',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                {s.label}
              </li>
            )
          })}
        </ol>
        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: 'var(--surface-alt)',
            borderRadius: 'var(--radius-md)',
            fontSize: 11,
            color: 'var(--ink-muted)',
            textAlign: 'center',
          }}
          aria-live="polite"
        >
          Hold expires in{' '}
          <strong style={{ color: holdRemaining < 60_000 ? 'var(--danger)' : 'var(--ink)' }}>
            {Math.floor(holdRemaining / 60_000)}:
            {String(Math.floor((holdRemaining % 60_000) / 1000)).padStart(2, '0')}
          </strong>
        </div>
      </nav>

      <div className="ch-card" style={{ padding: 36, minHeight: 480 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 'details' && (
              <>
                <h2 className="ch-display" style={{ fontSize: 30, color: 'var(--ink)', marginBottom: 8 }}>
                  {intent.content_title}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 20 }}>
                  by {intent.creator.display_name}
                </p>
                {intent.starts_at && (
                  <div
                    style={{
                      padding: 16,
                      background: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 4 }}>
                      Departure
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--ink)' }}>
                      {formatDate(intent.starts_at)}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                  We&rsquo;ve held your seat. Next we&rsquo;ll collect traveller details, then it&rsquo;s
                  off to UPI checkout.
                </div>
              </>
            )}

            {step === 'travellers' && (
              <>
                <h2 className="ch-display" style={{ fontSize: 30, color: 'var(--ink)', marginBottom: 16 }}>
                  Who&rsquo;s travelling?
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {travellers.map((t, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
                        Traveller {i + 1}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <input
                          placeholder="Full name"
                          value={t.name}
                          onChange={(e) => {
                            const copy = [...travellers]
                            copy[i] = { ...t, name: e.target.value }
                            setTravellers(copy)
                          }}
                          style={inputStyle}
                        />
                        <input
                          placeholder="Phone (+91…)"
                          value={t.phone}
                          onChange={(e) => {
                            const copy = [...travellers]
                            copy[i] = { ...t, phone: e.target.value }
                            setTravellers(copy)
                          }}
                          style={inputStyle}
                        />
                        <input
                          placeholder="Email"
                          type="email"
                          value={t.email}
                          onChange={(e) => {
                            const copy = [...travellers]
                            copy[i] = { ...t, email: e.target.value }
                            setTravellers(copy)
                          }}
                          style={{ ...inputStyle, gridColumn: '1 / -1' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'review' && (
              <>
                <h2 className="ch-display" style={{ fontSize: 30, color: 'var(--ink)', marginBottom: 16 }}>
                  Review &amp; confirm
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                  <ReviewRow label="Trip" value={intent.content_title} />
                  {intent.starts_at && <ReviewRow label="Departure" value={formatDate(intent.starts_at)} />}
                  <ReviewRow
                    label="Travellers"
                    value={travellers.map((t) => t.name).join(', ')}
                  />
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-soft)' }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked)
                    }}
                    style={{ marginTop: 2 }}
                  />
                  <span>
                    I accept the cancellation policy. Refundable up to 24 h before. GST included.
                  </span>
                </label>
              </>
            )}

            {step === 'payment' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    margin: '0 auto 20px',
                    borderRadius: 999,
                    border: '3px solid var(--hairline-strong)',
                    borderTopColor: 'var(--primary)',
                    animation: 'ch-spin 0.8s linear infinite',
                  }}
                  aria-hidden
                />
                <h2 className="ch-display" style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 8 }}>
                  Sending you to UPI…
                </h2>
                <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
                  Don&rsquo;t close this tab — we&rsquo;ll redirect to Razorpay in a moment.
                </p>
                <style>{`@keyframes ch-spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 20,
              padding: '12px 16px',
              background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {step !== 'payment' && (
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            {step !== 'details' && (
              <button type="button" onClick={back} className="ch-btn ch-btn-ghost">
                Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={next}
              disabled={!canProceed || pending}
              className="ch-btn ch-btn-primary"
            >
              {step === 'review' ? `Pay ${formatPrice(intent.pricing.total_paisa)}` : 'Continue'}
            </button>
          </div>
        )}
      </div>

      <aside style={{ position: 'sticky', top: 96 }}>
        <div className="ch-card" style={{ padding: 24 }}>
          <h3
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              marginBottom: 14,
            }}
          >
            Booking summary
          </h3>
          <PriceRow label="Base" value={formatPrice(intent.pricing.base_paisa)} />
          <PriceRow label={`Platform fee`} value={formatPrice(intent.pricing.platform_fee_paisa)} />
          <PriceRow label="GST 18%" value={formatPrice(intent.pricing.gst_paisa)} />
          <hr className="ch-divider" style={{ margin: '12px 0' }} />
          <PriceRow
            label="Total"
            value={formatPrice(intent.pricing.total_paisa)}
            emphasized
          />
        </div>
      </aside>
    </div>
  )
}

const inputStyle = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--hairline-strong)',
  background: 'var(--surface)',
  fontSize: 14,
  color: 'var(--ink)',
  fontFamily: 'inherit' as const,
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function PriceRow({
  label,
  value,
  emphasized,
}: {
  label: string
  value: string
  emphasized?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        margin: '6px 0',
        fontSize: emphasized ? 16 : 13,
        fontWeight: emphasized ? 600 : 400,
        color: emphasized ? 'var(--ink)' : 'var(--ink-soft)',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
