'use client'

import { useSignInModal } from '@/components/auth/sign-in-modal-provider'
import type { ReactNode } from 'react'

interface Props {
  /**
   * The gated content. Stays in the DOM (and the SSR HTML) — bots see
   * everything; humans see the gate. This avoids cloaking penalties.
   */
  children: ReactNode
  /**
   * `fade` (default) — content stays visible but blurs into a sign-in CTA.
   * Used for long-form continuation (Day 2+ of an itinerary).
   *
   * `redact` — content replaced with a blurred placeholder. Used for
   * leaky-by-default fields like exact venue + capacity + date slots.
   */
  mode?: 'fade' | 'redact'
  /** Modal label, e.g. "Read the full itinerary" or "See exact venue". */
  contextLabel: string
  /** One-line reason shown under the modal title. */
  reason?: string
  /** CTA button copy. Default: "Sign in to continue". */
  ctaLabel?: string
  /** When the parent already knows the user is authed, render children plain. */
  isAuthenticated: boolean
}

/**
 * Soft sign-in gate. Renders the wrapped content but visually obscures it
 * for guests, with a centred CTA that opens the contextual sign-in modal.
 * The full markup stays in the SSR response so search engines see
 * everything — only humans hit the gate.
 */
export function GuestGate({
  children,
  mode = 'fade',
  contextLabel,
  reason,
  ctaLabel = 'Sign in to continue',
  isAuthenticated,
}: Props) {
  const { openSignInModal } = useSignInModal()

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div
      style={{
        position: 'relative',
        marginTop: 24,
      }}
    >
      <div
        aria-hidden
        style={{
          // Truncate the gated content so the user sees a teaser, not a wall.
          maxHeight: mode === 'redact' ? 120 : 220,
          overflow: 'hidden',
          filter: mode === 'redact' ? 'blur(6px)' : 'none',
          opacity: mode === 'redact' ? 0.5 : 1,
          maskImage:
            mode === 'fade'
              ? 'linear-gradient(180deg, var(--ink) 0%, var(--ink) 35%, transparent 100%)'
              : undefined,
          WebkitMaskImage:
            mode === 'fade'
              ? 'linear-gradient(180deg, var(--ink) 0%, var(--ink) 35%, transparent 100%)'
              : undefined,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: mode === 'fade' ? -64 : 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '24px clamp(16px, 4vw, 40px) 32px',
          background:
            mode === 'fade'
              ? 'linear-gradient(180deg, transparent 0%, var(--bg) 50%, var(--bg) 100%)'
              : 'var(--surface)',
          borderRadius: mode === 'redact' ? 14 : 0,
          border: mode === 'redact' ? '1px dashed var(--hairline-strong)' : 'none',
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--primary-text-bg)',
          }}
        >
          Members only · free to join
        </span>
        <h3
          className="ch-display"
          style={{
            fontSize: 'clamp(18px, 2.4vw, 22px)',
            color: 'var(--ink)',
            margin: 0,
            lineHeight: 1.25,
            maxWidth: 480,
          }}
        >
          {contextLabel}
        </h3>
        {reason && (
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--ink-muted)',
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 460,
            }}
          >
            {reason}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            openSignInModal({ contextLabel, ...(reason !== undefined ? { reason } : {}) })
          }}
          className="ch-btn ch-btn-primary"
          style={{ padding: '11px 22px', fontSize: 14, marginTop: 10 }}
        >
          {ctaLabel}
        </button>
        <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
          30 seconds · no spam
        </span>
      </div>
    </div>
  )
}
