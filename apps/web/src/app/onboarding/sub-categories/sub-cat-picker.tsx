'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface SubCatOption {
  id: string
  label: string
  blurb: string
  photo: string
}

interface SubCatPickerProps {
  options: SubCatOption[]
}

const MIN_PICKS = 2

export function SubCatPicker({ options }: SubCatPickerProps) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submit() {
    setError(null)
    if (picked.size < MIN_PICKS) {
      setError(`Pick at least ${String(MIN_PICKS)} to continue`)
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/onboarding/sub-categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ sub_categories: Array.from(picked) }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { detail?: string } | null
          setError(body?.detail ?? 'Could not save')
          return
        }
        router.replace('/onboarding/city')
        router.refresh()
      } catch {
        setError('Network error — please retry')
      }
    })
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {options.map((opt) => {
          const isPicked = picked.has(opt.id)
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => {
                toggle(opt.id)
              }}
              aria-pressed={isPicked}
              {...(reduced ? {} : { whileHover: { y: -2 }, whileTap: { scale: 0.98 } })}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'relative',
                padding: 0,
                border: `2px solid ${isPicked ? 'var(--primary)' : 'var(--hairline)'}`,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface)',
                overflow: 'hidden',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                color: 'var(--ink)',
                fontFamily: 'inherit',
                boxShadow: isPicked
                  ? '0 0 0 4px var(--primary-tint), var(--shadow-md)'
                  : 'var(--shadow-sm)',
              }}
            >
              <div
                className={`ch-photo ${opt.photo}`}
                style={{ height: 140, borderRadius: 0 }}
                aria-hidden
              />
              <div style={{ padding: 16 }}>
                <div className="ch-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                  {opt.blurb}
                </div>
              </div>
              {isPicked && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 16,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                  }}
                >
                  ✓
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: picked.size >= MIN_PICKS ? 'var(--primary-deep)' : 'var(--ink-muted)',
            background:
              picked.size >= MIN_PICKS ? 'var(--primary-tint)' : 'var(--surface-alt)',
            padding: '6px 12px',
            borderRadius: 999,
          }}
          aria-live="polite"
        >
          {picked.size} / {options.length} selected
          {picked.size < MIN_PICKS ? ` · pick ${String(MIN_PICKS - picked.size)} more` : ''}
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={submit}
          disabled={picked.size < MIN_PICKS || pending}
          className="ch-btn ch-btn-primary"
          style={{ padding: '14px 24px', fontSize: 14.5 }}
        >
          {pending ? 'Saving…' : 'Continue'}
        </button>
      </div>
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: '10px 14px',
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
