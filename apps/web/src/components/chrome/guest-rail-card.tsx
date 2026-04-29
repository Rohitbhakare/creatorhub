import Link from 'next/link'

/**
 * Guest right-rail card — replaces the Quest ring + streak when no session.
 * Shows up on /feed for unauthenticated users so the layout doesn't collapse
 * and the CTA to join is unmissable.
 */
export function GuestRailCard({ next = '/feed' }: { next?: string }) {
  return (
    <div
      className="ch-card"
      style={{
        padding: 24,
        background: 'linear-gradient(160deg, var(--surface) 0%, var(--primary-tint) 120%)',
        border: '1px solid color-mix(in srgb, var(--primary) 25%, var(--hairline))',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--primary-deep)',
          display: 'block',
          marginBottom: 12,
        }}
      >
        You&rsquo;re browsing as guest
      </span>
      <h3
        className="ch-display"
        style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.2 }}
      >
        Join free to{' '}
        <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>save & follow</em>
      </h3>
      <p
        style={{
          fontSize: 13,
          color: 'var(--ink-soft)',
          lineHeight: 1.55,
          marginBottom: 16,
        }}
      >
        Track creators, save chapters, earn streak XP. No card needed — UPI-only when you book.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="ch-btn ch-btn-primary"
          style={{ padding: '10px 16px', fontSize: 13.5 }}
        >
          Join free
        </Link>
        <Link
          href={`/signin?next=${encodeURIComponent(next)}`}
          className="ch-btn ch-btn-ghost"
          style={{ padding: '10px 16px', fontSize: 13.5 }}
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}

/**
 * Slim banner across the top of authed sections — used on /feed when
 * browsing as guest, to keep the cue visible above the fold.
 */
export function GuestBanner({ next = '/feed' }: { next?: string }) {
  return (
    <div
      style={{
        background: 'var(--ink)',
        color: 'var(--surface)',
        textAlign: 'center',
        padding: '8px 16px',
        fontSize: 13,
      }}
    >
      <span style={{ marginRight: 8, fontWeight: 500 }}>
        You&rsquo;re browsing as a guest.
      </span>
      <Link
        href={`/signup?next=${encodeURIComponent(next)}`}
        style={{ color: 'var(--primary-tint)', fontWeight: 600, textDecoration: 'underline' }}
      >
        Join free
      </Link>{' '}
      to save chapters and book trips.
    </div>
  )
}
