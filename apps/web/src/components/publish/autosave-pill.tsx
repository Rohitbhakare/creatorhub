'use client'

import { useEffect, useState } from 'react'

export type AutosaveState = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

interface Props {
  state: AutosaveState
  /** When the last save succeeded — used to render "Saved Ns ago". */
  savedAt: Date | null
  /** Called when the user clicks the "Retry" CTA inside the error pill. */
  onRetry?: () => void
}

const COLORS: Record<AutosaveState, { bg: string; fg: string; dot: string }> = {
  idle: { bg: 'var(--surface-alt)', fg: 'var(--ink-muted)', dot: 'var(--ink-muted)' },
  saving: { bg: 'var(--surface-alt)', fg: 'var(--ink-soft)', dot: 'var(--ink-soft)' },
  saved: {
    bg: 'color-mix(in srgb, #1D9E75 12%, transparent)',
    fg: '#0F6E50',
    dot: '#1D9E75',
  },
  error: {
    bg: 'color-mix(in srgb, var(--primary) 14%, transparent)',
    fg: 'var(--primary-deep)',
    dot: 'var(--primary)',
  },
  offline: {
    bg: 'var(--surface-alt)',
    fg: 'var(--ink-muted)',
    dot: 'var(--ink-muted)',
  },
}

/**
 * 5-state autosave indicator pill (E5.5 T6).
 *
 * States:
 *   - `idle`       — no changes since last save
 *   - `saving`     — current save in flight
 *   - `saved`      — last save succeeded; renders "Saved Ns ago"
 *   - `error`      — last save failed; renders "Save failed · Retry" with a click handler
 *   - `offline`    — no network; renders "Offline · changes will save when you reconnect"
 *
 * The "Saved Ns ago" label re-renders every 30s while in `saved` state so it
 * stays accurate without polling on idle.
 */
export function AutosavePill({ state, savedAt, onRetry }: Props) {
  const [, force] = useState(0)

  // Keep the "Saved Ns ago" label fresh — re-render every 30s while saved.
  useEffect(() => {
    if (state !== 'saved' || !savedAt) return
    const id = setInterval(() => {
      force((n) => n + 1)
    }, 30_000)
    return () => {
      clearInterval(id)
    }
  }, [state, savedAt])

  const c = COLORS[state]
  const label = labelFor(state, savedAt)

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: 'inherit',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: c.dot,
          ...(state === 'saving' ? { animation: 'ch-pulse 1.2s ease-in-out infinite' } : {}),
        }}
      />
      <span>{label}</span>
      {state === 'error' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: 'transparent',
            border: 'none',
            color: c.fg,
            cursor: 'pointer',
            fontWeight: 700,
            textDecoration: 'underline',
            padding: 0,
            font: 'inherit',
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}

function labelFor(state: AutosaveState, savedAt: Date | null): string {
  switch (state) {
    case 'idle':
      return savedAt ? 'All changes saved' : 'Unsaved'
    case 'saving':
      return 'Saving…'
    case 'saved':
      return savedAt ? `Saved ${ago(savedAt)}` : 'Saved'
    case 'error':
      return 'Save failed ·'
    case 'offline':
      return "Offline — we'll save when you reconnect"
  }
}

function ago(at: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - at.getTime()) / 1000))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${String(seconds)}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${String(minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  return `${String(hours)}h ago`
}
