'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface SubCatOption {
  id: string
  label: string
  blurb: string
  unsplashId: string
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
          // Round-6 audit A3: previously we surfaced upstream `detail`
          // text directly — that meant users saw "Missing Authorization
          // header" on a stale-token submit. Map to friendly messages
          // by status; ignore the raw detail (it's developer-facing).
          setError(friendlySubmitError(res.status))
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
              {/* Round-6 audit B6: real travel photography instead of
                  the gradient placeholder. priority on the first card +
                  sizes for responsive serving. */}
              <div style={{ position: 'relative', height: 140, overflow: 'hidden' }} aria-hidden>
                <Image
                  src={`https://images.unsplash.com/${opt.unsplashId}?w=600&q=80&auto=format`}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 50vw, 220px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
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

/**
 * Status → user-facing copy mapper for the onboarding submit. Round-6
 * audit caught us rendering raw upstream `detail` strings ("Missing
 * Authorization header") to creators; this normalises everything to
 * friendly text. The dev-side detail still lands in network-tab + logs
 * for triage.
 */
function friendlySubmitError(status: number): string {
  if (status === 401 || status === 403) {
    return 'Your session timed out. Refresh the page and try again.'
  }
  if (status >= 500) {
    return 'Something went wrong on our end. Give it a moment and retry.'
  }
  return "Couldn't save — check your inputs and try again."
}
