'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  dataUrlToBlob,
  isStorageConfigured,
  uploadToStorage,
} from '@/lib/firebase-storage'
import { MarkdownBody } from '@/components/reader/markdown-body'
import { AutosavePill, type AutosaveState } from '@/components/publish/autosave-pill'
import { TipTapEditor } from '@/components/publish/tiptap-editor'
import { CoverCrop } from '@/components/publish/cover-crop'
import { PreviewIframe } from '@/components/publish/preview-iframe'

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

function autosaveState(
  pending: boolean,
  savedAt: Date | null,
  saveError: string | null,
  draftId: string | null,
): AutosaveState {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline'
  if (pending) return 'saving'
  if (saveError) return 'error'
  if (savedAt || draftId) return 'saved'
  return 'idle'
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
  // Two separate error channels: `error` is inline validation/UI feedback
  // ("Add a cover photo", "Title needs at least 4 characters") shown next
  // to the relevant field. `saveError` is a real autosave/publish failure
  // and drives the AutosavePill into its 'error' / "Save failed · Retry"
  // state. Conflating them caused the pill to read "Save failed" the moment
  // the user clicked Next on an empty cover step (round-2 QA bug).
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
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

  // Warn on tab-close / navigation when there are unsaved changes (E5.5 T8).
  // Modern browsers honour `preventDefault()` alone; legacy required setting
  // `returnValue` too — that's deprecated and we omit it.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent): void => {
      if (!dirtyRef.current) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((p) => ({ ...p, [key]: value }))
    dirtyRef.current = true
  }

  async function save(publish: boolean): Promise<{ ok: boolean; draftId?: string }> {
    setSaveError(null)
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
        setSaveError('Could not upload cover — try again')
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
      setSaveError(body?.detail ?? 'Save failed')
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
        <AutosavePill
          state={autosaveState(pending, savedAt, saveError, draftId)}
          savedAt={savedAt}
          onRetry={() => {
            void save(false)
          }}
        />
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
            {step === 'body' && (
              <BodyStep
                value={data.body}
                onChange={(v) => {
                  update('body', v)
                }}
                draftId={draftId}
                refreshToken={savedAt?.getTime() ?? 0}
              />
            )}
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

const STEP_LABELS: Record<Step, string> = {
  cover: 'Cover',
  details: 'Details',
  body: 'Body',
  spots: 'Spots',
  review: 'Review',
}

function ProgressRail({ steps, active }: { steps: Step[]; active: Step }) {
  const idx = steps.indexOf(active)
  return (
    <nav aria-label="Publish steps">
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {steps.map((s, i) => {
          const isActive = i === idx
          const isDone = i < idx
          return (
            <li
              key={s}
              aria-current={isActive ? 'step' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flex: '0 0 auto',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: isActive
                    ? 'var(--ink)'
                    : isDone
                      ? '#1D9E75'
                      : 'var(--surface-alt)',
                  color: isActive || isDone ? 'white' : 'var(--ink-muted)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-mono, var(--font-sans))',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
                }}
              >
                {STEP_LABELS[s]}
              </span>
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  style={{
                    width: 60,
                    height: 1,
                    background: 'var(--hairline)',
                    marginInline: 4,
                  }}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function CoverStep({ value, onChange }: { value: string; onChange: (dataUrl: string) => void }) {
  return (
    <div>
      <h2 className="ch-display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>
        Cover image
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 20 }}>
        Upload, then drag to position and scroll to zoom. We crop to 2:1 (1600 × 800).
      </p>
      <CoverCrop value={value} onChange={onChange} />
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

function BodyStep({
  value,
  onChange,
  draftId,
  refreshToken,
}: {
  value: string
  onChange: (v: string) => void
  draftId: string | null
  refreshToken: number
}) {
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
        <TipTapEditor value={value} onChange={onChange} />
      ) : draftId ? (
        // Real iframe preview against the actual reader components — gated
        // by the wizard having run at least one autosave (so a draftId
        // exists). E5.5 T7.
        <PreviewIframe draftId={draftId} refreshToken={refreshToken} height={600} />
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
          <p style={{ color: 'var(--ink-muted)', marginBottom: 12 }}>
            Save the draft once to enable the live preview. In the meantime, here's a
            markdown render:
          </p>
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

      {/* Drag-reorder via framer-motion Reorder.Group; only the spots
          for the active day participate. Reordering rewrites their
          orderIndex; spots in other days are unaffected. (E5.5 T5) */}
      {(() => {
        const activeSpots = spots.filter((s) => s.dayNumber === day)
        const otherSpots = spots.filter((s) => s.dayNumber !== day)

        const handleReorder = (next: Spot[]): void => {
          const renumbered = next.map((s, i) => ({ ...s, orderIndex: i }))
          update([...otherSpots, ...renumbered])
        }

        const moveBy = (spot: Spot, delta: number): void => {
          const idx = activeSpots.indexOf(spot)
          const target = idx + delta
          if (target < 0 || target >= activeSpots.length) return
          const next = [...activeSpots]
          next.splice(idx, 1)
          next.splice(target, 0, spot)
          handleReorder(next)
        }

        return (
          <Reorder.Group
            axis="y"
            values={activeSpots}
            onReorder={handleReorder}
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {activeSpots.map((s) => {
              const idxInWhole = spots.indexOf(s)
              return (
                <Reorder.Item
                  key={`${String(s.dayNumber)}-${String(s.orderIndex)}-${s.name}`}
                  value={s}
                  className="ch-card"
                  style={{
                    padding: 16,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    aria-hidden
                    title="Drag to reorder"
                    style={{
                      cursor: 'grab',
                      color: 'var(--ink-muted)',
                      fontSize: 18,
                      lineHeight: 1,
                      paddingTop: 4,
                      userSelect: 'none',
                    }}
                  >
                    ⠿
                  </span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      value={s.name}
                      onChange={(e) => {
                        patch(idxInWhole, 'name', e.target.value)
                      }}
                      placeholder="Spot name (e.g. Diveagar Beach)"
                      style={inputStyle}
                      aria-label="Spot name"
                    />
                    <textarea
                      value={s.description}
                      onChange={(e) => {
                        patch(idxInWhole, 'description', e.target.value)
                      }}
                      placeholder="Why stop here?"
                      rows={2}
                      style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                      aria-label="Spot description"
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          moveBy(s, -1)
                        }}
                        aria-label="Move spot up"
                        style={miniBtn}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          moveBy(s, 1)
                        }}
                        aria-label="Move spot down"
                        style={miniBtn}
                      >
                        ↓
                      </button>
                      <div style={{ flex: 1 }} />
                      <button
                        type="button"
                        onClick={() => {
                          removeAt(idxInWhole)
                        }}
                        style={{
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
                  </div>
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
        )
      })()}

      <button
        type="button"
        onClick={addSpot}
        className="ch-btn ch-btn-ghost"
        style={{ marginTop: 12, alignSelf: 'flex-start' }}
      >
        + Add stop to Day {String(day)}
      </button>
    </div>
  )
}

const miniBtn = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid var(--hairline)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
} as const

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
          color: 'var(--ink-muted)',
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
