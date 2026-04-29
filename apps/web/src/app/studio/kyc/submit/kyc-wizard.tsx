'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

type Step = 'pan' | 'aadhaar' | 'selfie' | 'bank' | 'review'

interface FormData {
  panNumber: string
  panName: string
  panDocUrl: string
  aadhaarLast4: string
  selfieDataUrl: string
  bankAccount: string
  bankIfsc: string
  bankName: string
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'pan', label: 'PAN' },
  { id: 'aadhaar', label: 'Aadhaar' },
  { id: 'selfie', label: 'Selfie' },
  { id: 'bank', label: 'Bank' },
  { id: 'review', label: 'Review' },
]

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/

export function KycWizard({ isResubmit }: { isResubmit: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('pan')
  const [data, setData] = useState<FormData>({
    panNumber: '',
    panName: '',
    panDocUrl: '',
    aadhaarLast4: '',
    selfieDataUrl: '',
    bankAccount: '',
    bankIfsc: '',
    bankName: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const stepIdx = STEPS.findIndex((s) => s.id === step)

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function next() {
    setError(null)
    if (step === 'pan') {
      if (!PAN_REGEX.test(data.panNumber)) {
        setError('PAN must look like AAAAA9999A')
        return
      }
      if (data.panName.trim().length < 2) {
        setError('Enter the name as it appears on the PAN')
        return
      }
      if (!data.panDocUrl) {
        setError('Upload a photo of your PAN card')
        return
      }
      setStep('aadhaar')
    } else if (step === 'aadhaar') {
      if (!/^\d{4}$/.test(data.aadhaarLast4)) {
        setError('Last 4 digits only')
        return
      }
      setStep('selfie')
    } else if (step === 'selfie') {
      if (!data.selfieDataUrl) {
        setError('Capture a selfie to continue')
        return
      }
      setStep('bank')
    } else if (step === 'bank') {
      if (!/^\d{9,18}$/.test(data.bankAccount)) {
        setError('Bank account 9–18 digits')
        return
      }
      if (!IFSC_REGEX.test(data.bankIfsc)) {
        setError('IFSC must look like AAAA0XXXXXX')
        return
      }
      if (data.bankName.trim().length < 2) {
        setError('Enter your bank name')
        return
      }
      setStep('review')
    } else {
      submit()
    }
  }

  function back() {
    setError(null)
    const idx = STEPS.findIndex((s) => s.id === step)
    if (idx > 0) {
      const prev = STEPS[idx - 1]
      if (prev) setStep(prev.id)
    }
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      try {
        // For now, server stores documents as data URLs. Real Firebase
        // Storage upload kicks in when NEXT_PUBLIC_FIREBASE_API_KEY is set.
        const res = await fetch('/api/kyc/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            panNumber: data.panNumber.toUpperCase(),
            panName: data.panName.trim(),
            aadhaarLast4: data.aadhaarLast4,
            bankAccount: data.bankAccount,
            bankIfsc: data.bankIfsc.toUpperCase(),
            bankName: data.bankName.trim(),
            selfieUrl: data.selfieDataUrl,
            panDocUrl: data.panDocUrl,
            resubmit: isResubmit,
          }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { detail?: string } | null
          setError(body?.detail ?? 'Submission failed — please review your details')
          return
        }
        router.replace('/studio/kyc')
        router.refresh()
      } catch {
        setError('Network error — please retry')
      }
    })
  }

  return (
    <div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
        }}
      >
        Studio · KYC · Step {String(stepIdx + 1)} of {String(STEPS.length)}
      </span>
      <h1
        className="ch-display"
        style={{ fontSize: 'clamp(28px, 4vw, 38px)', color: 'var(--ink)', margin: '8px 0 24px' }}
      >
        {STEPS[stepIdx]?.label}
      </h1>

      <ProgressRail step={step} />

      <div
        className="ch-card"
        style={{ padding: 32, maxWidth: 640, marginTop: 24, minHeight: 320 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 'pan' && (
              <PanStep data={data} onChange={update} />
            )}
            {step === 'aadhaar' && (
              <Field
                label="Aadhaar — last 4 digits"
                hint="We never store the full Aadhaar number."
                value={data.aadhaarLast4}
                onChange={(v) => {
                  update('aadhaarLast4', v.replace(/\D/g, '').slice(0, 4))
                }}
                inputMode="numeric"
                placeholder="0000"
                maxLength={4}
              />
            )}
            {step === 'selfie' && (
              <SelfieStep
                value={data.selfieDataUrl}
                onCapture={(url) => {
                  update('selfieDataUrl', url)
                }}
              />
            )}
            {step === 'bank' && <BankStep data={data} onChange={update} />}
            {step === 'review' && <ReviewStep data={data} />}
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

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {step !== 'pan' && (
            <button type="button" onClick={back} className="ch-btn ch-btn-ghost">
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={next}
            disabled={pending}
            className="ch-btn ch-btn-primary"
            style={{ padding: '12px 22px' }}
          >
            {step === 'review' ? (pending ? 'Submitting…' : 'Submit') : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgressRail({ step }: { step: Step }) {
  const idx = STEPS.findIndex((s) => s.id === step)
  return (
    <ol
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        gap: 4,
        maxWidth: 640,
      }}
    >
      {STEPS.map((s, i) => (
        <li
          key={s.id}
          aria-current={i === idx ? 'step' : undefined}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background: i <= idx ? 'var(--primary)' : 'var(--surface-alt)',
            transition: 'background 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      ))}
    </ol>
  )
}

function PanStep({
  data,
  onChange,
}: {
  data: FormData
  onChange: <K extends keyof FormData>(k: K, v: FormData[K]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field
        label="PAN number"
        value={data.panNumber}
        onChange={(v) => {
          onChange('panNumber', v.toUpperCase().slice(0, 10))
        }}
        placeholder="AAAAA9999A"
        autoComplete="off"
        maxLength={10}
      />
      <Field
        label="Name as on PAN"
        value={data.panName}
        onChange={(v) => {
          onChange('panName', v)
        }}
        placeholder="Full name"
        autoComplete="name"
      />
      <FileUpload
        label="Photo of PAN card"
        hint="JPG / PNG / WebP up to 5 MB. Make sure all corners are visible and there's no glare."
        value={data.panDocUrl}
        onChange={(url) => {
          onChange('panDocUrl', url)
        }}
      />
    </div>
  )
}

function BankStep({
  data,
  onChange,
}: {
  data: FormData
  onChange: <K extends keyof FormData>(k: K, v: FormData[K]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field
        label="Account number"
        value={data.bankAccount}
        onChange={(v) => {
          onChange('bankAccount', v.replace(/\D/g, '').slice(0, 18))
        }}
        inputMode="numeric"
        placeholder="9 to 18 digits"
        autoComplete="off"
      />
      <Field
        label="IFSC code"
        value={data.bankIfsc}
        onChange={(v) => {
          onChange('bankIfsc', v.toUpperCase().slice(0, 11))
        }}
        placeholder="AAAA0XXXXXX"
        autoComplete="off"
        maxLength={11}
      />
      <Field
        label="Bank name"
        value={data.bankName}
        onChange={(v) => {
          onChange('bankName', v)
        }}
        placeholder="State Bank of India"
        autoComplete="organization"
      />
    </div>
  )
}

function ReviewStep({ data }: { data: FormData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ReviewRow label="PAN" value={`${data.panNumber} · ${data.panName}`} />
      <ReviewRow label="Aadhaar" value={`xxxx-xxxx-${data.aadhaarLast4}`} />
      <ReviewRow label="Bank" value={`${data.bankName} · ${data.bankIfsc}`} />
      <ReviewRow label="Account" value={`${'•'.repeat(data.bankAccount.length - 4)}${data.bankAccount.slice(-4)}`} />
      <p
        style={{
          fontSize: 12,
          color: 'var(--ink-muted)',
          marginTop: 8,
          lineHeight: 1.5,
        }}
      >
        By submitting, you confirm these details are correct. We&rsquo;ll review within 24 hours.
        If anything looks wrong, we&rsquo;ll email you with what to fix.
      </p>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        padding: '10px 0',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  autoComplete?: string
  maxLength?: number
}

function Field({ label, value, onChange, placeholder, hint, inputMode, autoComplete, maxLength }: FieldProps) {
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
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
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
      {hint && (
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{hint}</span>
      )}
    </label>
  )
}

function FileUpload({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  onChange: (dataUrl: string) => void
}) {
  const [error, setError] = useState<string | null>(null)
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        onChange(result)
        setError(null)
      } else {
        setError('Could not read file')
      }
    }
    reader.readAsDataURL(f)
  }

  return (
    <div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          display: 'block',
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <label
        style={{
          display: 'block',
          padding: 16,
          borderRadius: 'var(--radius-md)',
          border: `2px dashed ${value ? 'var(--primary)' : 'var(--hairline-strong)'}`,
          background: value ? 'var(--primary-tint)' : 'var(--surface-alt)',
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFile}
          style={{ display: 'none' }}
        />
        {value ? (
          <span style={{ fontSize: 14, color: 'var(--primary-deep)', fontWeight: 600 }}>
            ✓ Uploaded — click to replace
          </span>
        ) : (
          <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
            Click to upload a photo
          </span>
        )}
      </label>
      {hint && (
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 6, display: 'block' }}>
          {hint}
        </span>
      )}
      {error && (
        <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6, display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  )
}

function SelfieStep({
  value,
  onCapture,
}: {
  value: string
  onCapture: (dataUrl: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 480, height: 480 },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => {
            t.stop()
          })
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch {
        setError('Camera access denied — enable it in browser settings to capture a selfie')
      }
    }
    if (!value) void start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => {
        t.stop()
      })
    }
  }, [value])

  function capture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, 480, 480)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    onCapture(dataUrl)
    streamRef.current?.getTracks().forEach((t) => {
      t.stop()
    })
  }

  function retake() {
    onCapture('')
  }

  if (value) {
    return (
      <div style={{ textAlign: 'center' }}>
        <img
          src={value}
          alt="Your selfie"
          style={{
            width: 240,
            height: 240,
            borderRadius: 999,
            objectFit: 'cover',
            border: '3px solid var(--primary)',
          }}
        />
        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={retake} className="ch-btn ch-btn-ghost">
            Retake
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 320,
          height: 320,
          margin: '0 auto',
          borderRadius: 999,
          overflow: 'hidden',
          background: 'var(--surface-sunk)',
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            border: '4px solid var(--primary)',
            borderRadius: 999,
            pointerEvents: 'none',
            opacity: 0.55,
          }}
        />
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 14 }}>
        Centre your face in the oval, good light, no sunglasses.
      </p>
      {error ? (
        <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 8 }}>{error}</p>
      ) : (
        <button
          type="button"
          onClick={capture}
          disabled={!ready}
          className="ch-btn ch-btn-primary"
          style={{ marginTop: 16, padding: '12px 22px' }}
        >
          Capture selfie
        </button>
      )}
    </div>
  )
}
