import Link from 'next/link'
import type { SessionPayload } from '@/lib/session'
import { InitialAvatar } from '@/components/ui/initial-avatar'
import { StreakChip } from '@/components/ui/streak-chip'
import { SearchTrigger } from './search-trigger'

type Variant = 'auth' | 'logged' | 'guest'

interface WebHeaderProps {
  session?: SessionPayload | null
  active?: 'home' | 'discover' | 'saved' | 'bookings' | 'studio' | null
  variant?: Variant
  streak?: number
}

const NAV_ITEMS: { id: 'home' | 'discover' | 'saved' | 'bookings'; label: string; href: string }[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'discover', label: 'Discover', href: '/discover' },
  { id: 'saved', label: 'Saved', href: '/saved' },
  { id: 'bookings', label: 'Bookings', href: '/bookings' },
]

export function WebHeader({
  session,
  active = null,
  variant,
  streak = 0,
}: WebHeaderProps) {
  const resolvedVariant: Variant = variant ?? (session ? 'logged' : 'guest')

  return (
    <header
      className="ch-glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div
        className="ch-container"
        style={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            flex: '0 0 auto',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: 'var(--primary)',
            }}
          />
          <span className="ch-brand">
            creator<em>hub</em>
          </span>
        </Link>

        {resolvedVariant === 'logged' && (
          <>
            <nav
              className="ch-hide-on-mobile"
              style={{ display: 'flex', gap: 2, marginLeft: 6 }}
              aria-label="Main"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.id
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={isActive ? 'ch-nav-active' : ''}
                    style={{
                      position: 'relative',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
                      textDecoration: 'none',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginLeft: 'auto',
                flex: '0 0 auto',
              }}
            >
              {/* Compact search icon — opens the Cmd+K palette overlay.
                  Falls back to navigating to /discover when JS is disabled
                  or for cmd/ctrl/middle-click ("open in new tab"). */}
              <SearchTrigger
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  textDecoration: 'none',
                  color: 'var(--ink)',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </SearchTrigger>
              {streak > 0 && (
                <span className="ch-hide-on-mobile">
                  <StreakChip days={streak} />
                </span>
              )}

              <Link
                href="/notifications"
                aria-label="Notifications"
                style={{
                  position: 'relative',
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  background: 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  textDecoration: 'none',
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth="1.8"
                  aria-hidden
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 7,
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: 'var(--primary)',
                    border: '2px solid var(--surface)',
                  }}
                />
              </Link>

              <Link
                href="/publish"
                className="ch-btn ch-btn-ink"
                style={{ padding: '9px 14px 9px 12px', fontSize: 13 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="ch-hide-on-mobile">Publish</span>
              </Link>

              <Link href="/you" aria-label="Profile" style={{ display: 'flex', textDecoration: 'none' }}>
                <InitialAvatar
                  name={session?.displayName ?? '?'}
                  url={session?.avatarUrl ?? null}
                  size={34}
                />
              </Link>
            </div>
          </>
        )}

        {resolvedVariant === 'guest' && (
          <>
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {/* Compact search icon — Cmd+K palette is the primary search entry. */}
              <Link
                href="/discover"
                aria-label="Search"
                title="Search (⌘K)"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  textDecoration: 'none',
                  color: 'var(--ink)',
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Link>
              {/* Publish for guests — routes through signup so they create
                  an account first, then land on /publish to start a draft.
                  Note: removed the "Browse" + "For creators" text links —
                  the search icon already covers /discover, and the Publish
                  button signals the creator path on its own. */}
              <Link
                href="/signup?next=/publish"
                className="ch-btn ch-btn-ink"
                style={{ padding: '8px 14px 8px 12px', fontSize: 13 }}
                title="Sign up to publish your first story"
                aria-label="Sign up to publish your first story"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  aria-hidden
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="ch-hide-on-mobile">Publish</span>
              </Link>
              <Link
                href="/signin"
                className="ch-btn ch-btn-ghost ch-hide-on-mobile"
                style={{ padding: '8px 16px' }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="ch-btn ch-btn-primary"
                style={{ padding: '8px 16px' }}
              >
                Join
              </Link>
            </div>
          </>
        )}

        {resolvedVariant === 'auth' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              href="/discover"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', textDecoration: 'none' }}
            >
              Browse stories
            </Link>
            <Link href="/signin" className="ch-btn ch-btn-ghost" style={{ padding: '8px 16px' }}>
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
