import type { Metadata } from 'next'
import Link from 'next/link'

// In Next.js 15.5 a notFound() thrown after metadata commits the response as
// HTTP 200 — the body is still our not-found.tsx, but the status code is
// wrong. Adding noindex here means Google won't index "Not found" pages even
// if they slip through with status 200. Twitter/Facebook treat noindex on OG
// cards the same way.
export const metadata: Metadata = {
  title: 'Not found',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}
        >
          404
        </span>
        <h1
          className="ch-display"
          style={{ fontSize: 36, color: 'var(--ink)', margin: '12px 0 16px' }}
        >
          We couldn&rsquo;t find that
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 24 }}>
          The page may have moved, or the link might be slightly off. Try heading back to the
          discover feed and starting from there.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/discover" className="ch-btn ch-btn-primary">
            Browse discover
          </Link>
          <Link href="/" className="ch-btn ch-btn-ghost">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
