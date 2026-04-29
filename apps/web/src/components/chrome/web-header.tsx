import Link from 'next/link'
import type { SessionPayload } from '@/lib/session'

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

function Avatar({
  name,
  url,
  size = 34,
}: {
  name: string
  url?: string | null
  size?: number
}) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: url ? 'transparent' : 'linear-gradient(135deg, #d4b896, #a07c5a)',
        color: 'white',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-serif)',
        fontWeight: 600,
        fontSize: size * 0.4,
        flex: '0 0 auto',
        overflow: 'hidden',
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {url ? '' : initials || '?'}
    </div>
  )
}

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

            <Link
              href="/discover"
              prefetch={false}
              className="ch-hide-on-mobile"
              style={{
                flex: '1 1 auto',
                maxWidth: 380,
                height: 40,
                marginLeft: 'auto',
                background: 'var(--surface-alt)',
                borderRadius: 999,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'var(--ink-muted)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style={{ flex: 1, fontSize: 13 }}>Search creators, places, trips…</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  padding: '2px 5px',
                  borderRadius: 4,
                  background: 'var(--surface)',
                  border: '1px solid var(--hairline)',
                  fontWeight: 500,
                }}
              >
                ⌘ K
              </span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
              {streak > 0 && (
                <div
                  title={`${String(streak)}-day streak`}
                  className="ch-hide-on-mobile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 11px 6px 8px',
                    borderRadius: 999,
                    background: 'var(--primary-tint)',
                    color: 'var(--primary-deep)',
                    fontSize: 12,
                    fontWeight: 700,
                    border: '1px solid color-mix(in srgb, var(--primary) 13%, transparent)',
                  }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1 }} aria-hidden>
                    🔥
                  </span>
                  {streak}
                  <span style={{ opacity: 0.65, fontWeight: 500 }}>d</span>
                </div>
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
                <Avatar name={session?.displayName ?? '?'} url={session?.avatarUrl ?? null} />
              </Link>
            </div>
          </>
        )}

        {resolvedVariant === 'guest' && (
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Link
              href="/discover"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)', textDecoration: 'none' }}
            >
              Browse stories
            </Link>
            <Link href="/signin" className="ch-btn ch-btn-ghost" style={{ padding: '8px 16px' }}>
              Sign in
            </Link>
            <Link href="/signup" className="ch-btn ch-btn-primary" style={{ padding: '8px 16px' }}>
              Join
            </Link>
          </div>
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
