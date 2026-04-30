'use client'

import { useEffect, useState } from 'react'

/**
 * Site-wide toast region — a polite `aria-live` container that lives at
 * `<body>`'s end and is the single mount point for transient announcements
 * (saves, follows, errors, network failures). Subsequent epics will build
 * a richer toast UI on top of `pushToast(message)`; this foundation just
 * wires the accessible scaffolding (WEB-A11Y-FR-108).
 *
 * Keep this simple — no animation library, no portals, no z-index war.
 * One DOM node, one event subscriber.
 */

type Tone = 'info' | 'success' | 'error'

interface ToastEvent {
  message: string
  tone: Tone
  /** ms before auto-dismiss; default 4000. Pass 0 for sticky. */
  ttl?: number
  /** Stable id used for de-duplication. Defaults to `${Date.now()}-${rand}`. */
  id?: string
}

interface ActiveToast extends Required<Omit<ToastEvent, 'ttl'>> {
  ttl: number
}

const EVENT = 'ch-toast'
const MAX_VISIBLE = 3 // Drop oldest beyond this — protects against runaway loops.

/**
 * Public API: dispatch a toast from anywhere (Server Action callback,
 * onClick handler, etc.). Safe to call before `<ToastRegion />` mounts —
 * it queues via the DOM event bus.
 */
export function pushToast(event: ToastEvent): void {
  if (typeof window === 'undefined') return
  const detail: ActiveToast = {
    id: event.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    message: event.message,
    tone: event.tone,
    ttl: event.ttl ?? 4000,
  }
  window.dispatchEvent(new CustomEvent<ActiveToast>(EVENT, { detail }))
}

export function ToastRegion() {
  const [toasts, setToasts] = useState<ActiveToast[]>([])

  useEffect(() => {
    function onPush(e: Event) {
      const event = e as CustomEvent<ActiveToast>
      const toast = event.detail
      setToasts((prev) => {
        // De-duplicate by id.
        if (prev.some((t) => t.id === toast.id)) return prev
        const next = [...prev, toast]
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next
      })
      if (toast.ttl > 0) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id))
        }, toast.ttl)
      }
    }
    window.addEventListener(EVENT, onPush)
    return () => {
      window.removeEventListener(EVENT, onPush)
    }
  }, [])

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 90,
        pointerEvents: 'none',
        maxWidth: 380,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            background: 'var(--ink)',
            color: 'var(--surface)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13.5,
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'auto',
            borderLeft:
              t.tone === 'error'
                ? '3px solid var(--danger)'
                : t.tone === 'success'
                  ? '3px solid var(--success)'
                  : '3px solid var(--primary)',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
