import Link from 'next/link'

/**
 * Guest right-rail card — replaces the Quest ring + streak when no session.
 * The card is intentionally quiet: one primary CTA, one ghost link, no
 * gradient halo. The header already carries the big Join button; this is
 * the contextual nudge, not the loudest CTA on the page.
 */
export function GuestRailCard({ next = '/' }: { next?: string }) {
  return (
    <div
      className="ch-card"
      style={{
        padding: 20,
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          display: 'block',
          marginBottom: 10,
        }}
      >
        Browsing as guest
      </span>
      <h3
        className="ch-display"
        style={{ fontSize: 19, color: 'var(--ink)', marginBottom: 6, lineHeight: 1.25 }}
      >
        Save your favourite work
      </h3>
      <p
        style={{
          fontSize: 12.5,
          color: 'var(--ink-muted)',
          lineHeight: 1.55,
          marginBottom: 14,
        }}
      >
        Follow creators, save what inspires you, get notified for live drops.
      </p>
      <Link
        href={`/signup?next=${encodeURIComponent(next)}`}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--primary-deep)',
          textDecoration: 'none',
          borderBottom: '1.5px solid var(--primary)',
          paddingBottom: 2,
        }}
      >
        Create a free account →
      </Link>
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
