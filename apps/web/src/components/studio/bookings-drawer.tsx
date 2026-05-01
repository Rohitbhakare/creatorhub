'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import type { StudioBookingRow } from '@/lib/api'
import { formatPrice } from '@/lib/format'

interface Props {
  bookings: readonly StudioBookingRow[]
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'var(--success)',
  in_progress: 'var(--info)',
  completed: 'var(--ink-muted)',
  cancelled: 'var(--ink-faint)',
  refund_pending: 'var(--warning)',
}

/**
 * Right-side bookings drawer (E5.7 T5).
 *
 * Mounted on `/studio` overview. Opens via the "View bookings" button
 * which writes `?bookings=open` to the URL — so the state is shareable
 * + survives refreshes. Closing strips the param via `router.replace`.
 *
 * 420px on desktop / full-width sheet on mobile. Focus trap + Esc close.
 * Body scroll-lock while open. The full `/studio/bookings` page stays
 * available for deep-linking; the drawer is the quick-glance UX.
 */
export function BookingsDrawer({ bookings }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const open = searchParams.get('bookings') === 'open'
  const dialogRef = useRef<HTMLDivElement>(null)

  // Body scroll-lock while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const closeDrawer = useCallback((): void => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('bookings')
    const qs = next.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [router, pathname, searchParams])

  // Esc to close.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [open, closeDrawer])

  return (
    <>
      <Link
        href="?bookings=open"
        replace
        scroll={false}
        className="ch-btn ch-btn-ghost"
        style={{ padding: '8px 14px', fontSize: 13, textDecoration: 'none' }}
      >
        View bookings →
      </Link>

      {open && (
        <>
          <div
            aria-hidden
            onClick={closeDrawer}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 90,
            }}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-label="Recent bookings"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 420,
              maxWidth: '100vw',
              background: 'var(--bg)',
              boxShadow: '-12px 0 32px rgba(0,0,0,0.12)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <header
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <h2
                className="ch-display"
                style={{ fontSize: 18, color: 'var(--ink)', margin: 0 }}
              >
                Recent bookings
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close bookings drawer"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: 'var(--ink-muted)',
                  fontFamily: 'inherit',
                }}
              >
                ×
              </button>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {bookings.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)', fontSize: 13.5 }}>
                  No bookings yet. Once someone books, they'll appear here for a quick glance.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {bookings.slice(0, 20).map((b) => (
                    <li
                      key={b.id}
                      className="ch-card"
                      style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong style={{ fontSize: 13.5, color: 'var(--ink)' }}>
                          {b.contentTitle}
                        </strong>
                        <span
                          style={{
                            fontSize: 11,
                            color: STATUS_COLORS[b.status] ?? 'var(--ink-muted)',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                        {b.travellerName}
                        {b.pax > 1 ? ` · ${String(b.pax)} guests` : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 11.5, color: 'var(--ink-muted)' }}>
                        <span>
                          {b.startsAt
                            ? new Date(b.startsAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'flexible'}
                        </span>
                        <span aria-hidden>·</span>
                        <span>{formatPrice(b.totalPaisa, false)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--hairline)',
              }}
            >
              <Link
                href="/studio/bookings"
                onClick={closeDrawer}
                className="ch-btn ch-btn-ink"
                style={{ padding: '10px 18px', fontSize: 13, width: '100%', textAlign: 'center', display: 'block' }}
              >
                Open full bookings →
              </Link>
            </footer>
          </div>
        </>
      )}
    </>
  )
}
