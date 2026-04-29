'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  dataUrlToBlob,
  isStorageConfigured,
  uploadToStorage,
} from '@/lib/firebase-storage'
import { MarkdownBody } from '@/components/reader/markdown-body'

type PublishType = 'post' | 'itinerary' | 'experience' | 'event'
type Step = 'cover' | 'details' | 'body' | 'spots' | 'review'

interface Spot {
  name: string
  description: string
  dayNumber: number
  orderIndex: number
}

interface FormData {
  coverDataUrl: string
  coverUrl: string
  title: string
  summary: string
  city: string
  durationDays: number
  body: string
  priceInPaisa: number
  isFree: boolean
  spots: Spot[]
}

const STEP_FOR_TYPE: Record<PublishType, Step[]> = {
  post: ['cover', 'details', 'body', 'review'],
  itinerary: ['cover', 'details', 'body', 'spots', 'review'],
  experience: ['cover', 'details', 'body', 'spots', 'review'],
  event: ['cover', 'details', 'body', 'review'],
}

const TYPE_LABELS: Record<PublishType, string> = {
  post: 'Post',
  itinerary: 'Itinerary',
  experience: 'Experience',
  event: 'Event',
}

export function PublishWizard({ type }: { type: PublishType }) {
  const router = useRouter()
  const steps = STEP_FOR_TYPE[type]
  const [step, setStep] = useState<Step>('cover')
  const [data, setData] = useState<FormData>({
    coverDataUrl: '',
    coverUrl: '',
    title: '',
    summary: '',
    city: '',
    durationDays: 1,
    body: '',
    priceInPaisa: 0,
    isFree: true,
    spots: [],
  })
  const [draftId, setDraftId] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dirtyRef = useRef(false)

  const stepIdx = steps.indexOf(step)

  // Autosave every 8s if dirty.
  useEffect(() => {
    const id = setInterval(() => {
      if (dirtyRef.current && data.title.trim().length >= 4) {
        void save(false)
      }
    }, 8_000)
    return () => {
      clearInterval(id)
    }
  }, [data, save])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((p) => ({ ...p, [key]: value }))
    dirtyRef.current = true
  }

  async function save(publish: boolean): Promise<{ ok: boolean; draftId?: string }> {
    let coverUrl = data.coverUrl
    if (data.coverDataUrl && !data.coverUrl && isStorageConfigured()) {
      try {
        const blob = await dataUrlToBlob(data.coverDataUrl)
        coverUrl = await uploadToStorage({
          path: 'covers',
          file: blob,
          contentType: blob.type || 'image/jpeg',
        })
        update('coverUrl', coverUrl)
      } catch {
        setError('Could not upload cover — try again')
        return { ok: false }
      }
    }
    const res = await fetch('/api/publish/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        ...(draftId ? { draftId } : {}),
        type,
        title: data.title.trim(),
        summary: data.summary.trim(),
        body: data.body,
        ...(coverUrl ? { coverUrl } : {}),
        priceInPaisa: data.isFree ? 0 : data.priceInPaisa,
        isFree: data.isFree,
        ...(data.city.trim() ? { city: data.city.trim() } : {}),
        durationDays: data.durationDays,
        spots: data.spots,
        publish,
      }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { detail?: string } | null
      setError(body?.detail ?? 'Save failed')
      return { ok: false }
    }
    const result = (await res.json()) as { draftId: string }
    if (!draftId) setDraftId(result.draftId)
    setSavedAt(new Date())
    dirtyRef.current = false
    return { ok: true, draftId: result.draftId }
  }

  function next() {
    setError(null)
    if (step === 'cover') {
      if (!data.coverDataUrl && !data.coverUrl) {
        setError('Add a cover photo to continue')
        return
      }
      setStep('details')
    } else if (step === 'details') {
      if (data.title.trim().length < 4) {
        setError('Title needs at least 4 characters')
        return
      }
      setStep(steps.includes('body') ? 'body' : 'review')
    } else if (step === 'body') {
      if (type !== 'post' && data.body.trim().length < 80) {
        setError('Body should be a few sentences (80+ chars) for itineraries and experiences')
        return
      }
      setStep(steps.includes('spots') ? 'spots' : 'review')
    } else if (step === 'spots') {
      setStep('review')
    } else {
      submit()
    }
  }

  function back() {
    setError(null)
    const idx = steps.indexOf(step)
    if (idx > 0) {
      const prev = steps[idx - 1]
      if (prev) setStep(prev)
    }
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await save(true)
      if (!result.ok) return
      router.replace(`/content/${String(result.draftId)}?just=1`)
    })
  }

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
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
            New {TYPE_LABELS[type]} · Step {String(stepIdx + 1)} of {String(steps.length)}
          </span>
          <h1
            className="ch-display"
            style={{ fontSize: 'clamp(28px, 4vw, 38px)', color: 'var(--ink)', margin: '8px 0 0' }}
          >
            {data.title.trim() || `Untitled ${TYPE_LABELS[type]}`}
          </h1>
        </div>
        <div
          style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 8 }}
          aria-live="polite"
        >
          {pending ? 'Saving…' : savedAt ? `Saved · ${savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : draftId ? 'Saved' : 'Unsaved'}
        </div>
      </header>

      <ProgressRail steps={steps} active={step} />

      <div className="ch-card" style={{ padding: 32, marginTop: 24 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 'cover' && (
              <CoverStep
                value={data.coverDataUrl}
                onChange={(url) => {
                  update('coverDataUrl', url)
                  update('coverUrl', '')
                }}
              />
            )}
            {step === 'details' && <DetailsStep data={data} update={update} type={type} />}
            {step === 'body' && <BodyStep value={data.body} onChange={(v) => { update('body', v) }} />}
            {step === 'spots' && <SpotsStep spots={data.spots} update={(spots) => { update('spots', spots) }} />}
            {step === 'review' && <ReviewStep data={data} type={type} />}
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
          {stepIdx > 0 && (
            <button type="button" onClick={back} className="ch-btn ch-btn-ghost">
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {stepIdx < steps.length - 1 && (
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  void save(false)
                })
              }}
              className="ch-btn ch-btn-ghost"
              disabled={pending}
            >
              Save draft
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={pending}
            className="ch-btn ch-btn-primary"
          >
            {step === 'review' ? (pending ? 'Publishing…' : 'Publish') : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgressRail({ steps, active }: { steps: Step[]; active: Step }) {
  const idx = steps.indexOf(active)
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: 4 }}>
      {steps.map((s, i) => (
        <li
          key={s}
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

function CoverStep({ value, onChange }: { value: string; onChange: (dataUrl: string) => void }) {
  const [error, setError] = useState<string | null>(null)
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 8 * 1024 * 1024) {
      setError('Cover must be under 8 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r === 'string') {
        onChange(r)
        setError(null)
      }
    }
    reader.readAsDataURL(f)
  }
  return (
    <div>
      <h2 className="ch-display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>
        Cover image
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 20 }}>
        2:1 aspect works best. JPG, PNG, or WebP up to 8 MB.
      </p>
      <label
        style={{
          display: 'block',
          aspectRatio: '2/1',
          borderRadius: 'var(--radius-lg)',
          border: `2px dashed ${value ? 'var(--primary)' : 'var(--hairline-strong)'}`,
          background: value ? 'transparent' : 'var(--surface-alt)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} style={{ display: 'none' }} />
        {value ? (
          <img src={value} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--ink-muted)',
              fontSize: 14,
            }}
          >
            Click to upload — or drag & drop
          </div>
        )}
      </label>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</p>}
    </div>
  )
}

function DetailsStep({
  data,
  update,
  type,
}: {
  data: FormData
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  type: PublishType
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field
        label="Title"
        hint={`${String(data.title.length)} / 80 chars`}
        value={data.title}
        onChange={(v) => {
          update('title', v.slice(0, 80))
        }}
        placeholder="Konkan in 4 quiet days"
      />
      <Field
        label="One-line summary"
        hint={`${String(data.summary.length)} / 240 chars`}
        value={data.summary}
        onChange={(v) => {
          update('summary', v.slice(0, 240))
        }}
        placeholder="A coastal route from Mumbai to Diveagar, slow."
      />
      <Field
        label="From city"
        value={data.city}
        onChange={(v) => {
          update('city', v)
        }}
        placeholder="Mumbai"
      />
      {type !== 'post' && (
        <Field
          label="Duration (days)"
          value={String(data.durationDays)}
          onChange={(v) => {
            update('durationDays', Math.max(1, Math.min(60, Number(v) || 1)))
          }}
          inputMode="numeric"
          placeholder="4"
        />
      )}
      {type !== 'post' && (
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
            Pricing
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="radio"
                checked={data.isFree}
                onChange={() => {
                  update('isFree', true)
                }}
              />
              Free
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="radio"
                checked={!data.isFree}
                onChange={() => {
                  update('isFree', false)
                }}
              />
              Paid
            </label>
            {!data.isFree && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <span style={{ color: 'var(--ink-muted)' }}>₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(data.priceInPaisa / 100)}
                  onChange={(e) => {
                    const rupees = Number(e.target.value.replace(/\D/g, '')) || 0
                    update('priceInPaisa', rupees * 100)
                  }}
                  placeholder="0"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--hairline-strong)',
                    background: 'var(--surface)',
                    fontSize: 15,
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                    width: 140,
                  }}
                />
                <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
                  Buyer also pays 18% GST.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BodyStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  return (
    <div>
      <h2 className="ch-display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>
        The story
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12 }}>
        Markdown supported: <code>## heading</code>, <code>**bold**</code>, <code>*italic*</code>,{' '}
        <code>&gt; pull-quote</code>. Blank line splits paragraphs.
      </p>
      <div
        role="tablist"
        style={{ display: 'flex', gap: 6, marginBottom: 12, borderBottom: '1px solid var(--hairline)' }}
      >
        {(['edit', 'preview'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t)
            }}
            style={{
              padding: '10px 14px',
              border: 0,
              borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
              background: 'transparent',
              fontWeight: tab === t ? 600 : 500,
              fontSize: 13.5,
              color: tab === t ? 'var(--ink)' : 'var(--ink-muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: -1,
            }}
          >
            {t === 'edit' ? 'Write' : 'Preview'}
          </button>
        ))}
      </div>
      {tab === 'edit' ? (
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
          rows={18}
          placeholder="We left at sunrise. The Mumbai-Pune highway empties at 5 a.m., and that's the road's secret…"
          style={{
            width: '100%',
            padding: 16,
            fontSize: 16,
            lineHeight: 1.7,
            fontFamily: 'var(--font-serif)',
            color: 'var(--ink)',
            background: 'var(--surface)',
            border: '1.5px solid var(--hairline-strong)',
            borderRadius: 'var(--radius-md)',
            resize: 'vertical',
            minHeight: 360,
          }}
        />
      ) : (
        <div
          style={{
            padding: 24,
            background: 'var(--surface-alt)',
            borderRadius: 'var(--radius-md)',
            minHeight: 360,
            maxWidth: 720,
          }}
        >
          {value.trim() ? (
            <MarkdownBody body={value} />
          ) : (
            <p style={{ color: 'var(--ink-muted)' }}>Nothing to preview yet — start writing.</p>
          )}
        </div>
      )}
    </div>
  )
}

function SpotsStep({
  spots,
  update,
}: {
  spots: Spot[]
  update: (spots: Spot[]) => void
}) {
  const [day, setDay] = useState(1)
  const dayCount = Math.max(1, ...spots.map((s) => s.dayNumber))

  function addSpot() {
    const orderForDay = spots.filter((s) => s.dayNumber === day).length
    update([...spots, { name: '', description: '', dayNumber: day, orderIndex: orderForDay }])
  }

  function removeAt(idx: number) {
    update(spots.filter((_, i) => i !== idx))
  }

  function patch(idx: number, field: keyof Spot, value: Spot[keyof Spot]) {
    update(spots.map((s, i) => (i === idx ? ({ ...s, [field]: value } as Spot) : s)))
  }

  return (
    <div>
      <h2 className="ch-display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>
        Stops along the way
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 16 }}>
        Add the places travellers will visit each day. They show up as numbered cards in the
        reader.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Array.from({ length: dayCount + 1 }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDay(d)
            }}
            aria-pressed={day === d}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: `1.5px solid ${day === d ? 'var(--primary)' : 'var(--hairline)'}`,
              background: day === d ? 'var(--primary-tint)' : 'var(--surface)',
              color: day === d ? 'var(--primary-deep)' : 'var(--ink)',
              fontSize: 13,
              fontWeight: day === d ? 600 : 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Day {String(d)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {spots
          .map((s, i) => ({ s, i }))
          .filter(({ s }) => s.dayNumber === day)
          .map(({ s, i }) => (
            <div
              key={i}
              className="ch-card"
              style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <input
                value={s.name}
                onChange={(e) => {
                  patch(i, 'name', e.target.value)
                }}
                placeholder="Spot name (e.g. Diveagar Beach)"
                style={inputStyle}
              />
              <textarea
                value={s.description}
                onChange={(e) => {
                  patch(i, 'description', e.target.value)
                }}
                placeholder="Why stop here?"
                rows={2}
                style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
              />
              <button
                type="button"
                onClick={() => {
                  removeAt(i)
                }}
                style={{
                  alignSelf: 'flex-start',
                  background: 'transparent',
                  border: 0,
                  color: 'var(--danger)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ))}

        <button
          type="button"
          onClick={addSpot}
          className="ch-btn ch-btn-ghost"
          style={{ alignSelf: 'flex-start' }}
        >
          + Add stop to Day {String(day)}
        </button>
      </div>
    </div>
  )
}

function ReviewStep({ data, type }: { data: FormData; type: PublishType }) {
  const checks: { ok: boolean; label: string }[] = [
    { ok: Boolean(data.coverDataUrl || data.coverUrl), label: 'Cover image' },
    { ok: data.title.trim().length >= 4, label: 'Title' },
    { ok: data.summary.trim().length >= 10, label: 'Summary' },
    {
      ok: type === 'post' ? data.body.trim().length >= 20 : data.body.trim().length >= 80,
      label: 'Story body',
    },
    ...(type === 'itinerary' || type === 'experience'
      ? [{ ok: data.spots.length >= 1, label: 'At least 1 stop' }]
      : []),
  ]
  const allReady = checks.every((c) => c.ok)
  return (
    <div>
      <h2 className="ch-display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 16 }}>
        Ready?
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {checks.map((c) => (
          <li
            key={c.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: c.ok ? 'color-mix(in srgb, var(--success) 8%, var(--surface))' : 'var(--surface-alt)',
              border: `1px solid ${c.ok ? 'color-mix(in srgb, var(--success) 30%, var(--hairline))' : 'var(--hairline)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              color: c.ok ? 'var(--ink)' : 'var(--ink-muted)',
            }}
          >
            <span aria-hidden style={{ color: c.ok ? 'var(--success)' : 'var(--ink-faint)' }}>
              {c.ok ? '✓' : '○'}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
      {!allReady && (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 16 }}>
          Fill in the missing pieces before publishing — go back to update them.
        </p>
      )}
      <p
        style={{
          fontSize: 12,
          color: 'var(--ink-faint)',
          marginTop: 24,
          lineHeight: 1.5,
          maxWidth: 480,
        }}
      >
        Once published, this {TYPE_LABELS[type].toLowerCase()} appears on your mini-site and in
        the discover feed. You can edit or unpublish anytime from Studio · Content.
      </p>
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
}

function Field({ label, value, onChange, placeholder, hint, inputMode }: FieldProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
        }}
      >
        <span>{label}</span>
        {hint && <span style={{ fontWeight: 500, letterSpacing: 0 }}>{hint}</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        placeholder={placeholder}
        inputMode={inputMode}
        style={inputStyle}
      />
    </label>
  )
}

const inputStyle = {
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--hairline-strong)',
  background: 'var(--surface)',
  fontSize: 15,
  color: 'var(--ink)',
  fontFamily: 'inherit' as const,
  width: '100%',
}
