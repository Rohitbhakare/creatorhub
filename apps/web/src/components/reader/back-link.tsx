'use client'

import { useRouter } from 'next/navigation'

/**
 * Small "← Back" link for the content reader. Round-5 audit caught that
 * content detail pages had no back affordance except the browser button —
 * a dead-end on mobile/keyboard.
 *
 * Behaviour:
 *   - Renders as a real `<a href="/">` so SSR + screen readers + Cmd-click
 *     ("open in new tab") all see a working same-origin link.
 *   - On click, prefers `router.back()` when there's a referrer in the same
 *     origin (preserves scroll position + filter state on the previous page);
 *     falls back to navigating to `/` when the user landed here via deep
 *     link / share.
 *
 * Positioned by the parent — typically `position: fixed; top: 16px; left:
 * 24px; z-index: 30` so it floats over the parallax hero on the content
 * detail page. Caller passes `style` to control placement.
 */
interface Props {
  /** href used for SSR / Cmd-click / fallback when there's no history. */
  fallback?: string
  /** Inline style overrides for placement (top/left/position/z-index). */
  style?: React.CSSProperties
  /** Optional aria-label override. Default "Back". */
  ariaLabel?: string
}

export function BackLink({ fallback = '/', style, ariaLabel = 'Back' }: Props) {
  const router = useRouter()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Allow new-tab / open-in-window modifiers to fall through to the <a>.
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return
    // Only intercept when there's same-origin history to go back to —
    // otherwise the fallback href takes the user somewhere meaningful.
    if (typeof window === 'undefined') return
    const ref = document.referrer
    const sameOrigin = ref && new URL(ref).origin === window.location.origin
    if (sameOrigin && window.history.length > 1) {
      e.preventDefault()
      router.back()
    }
  }

  return (
    <a
      href={fallback}
      onClick={handleClick}
      aria-label={ariaLabel}
      className="ch-btn ch-btn-ghost"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        padding: '8px 14px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        ...style,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Back
    </a>
  )
}
